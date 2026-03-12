import {
  createDisputeCase,
  escalateDisputeTier,
  getDisputeTierSlaDays,
  transitionBondState,
  transitionDisputeState,
  ConflictError,
  NotFoundError,
  ValidationError,
  type Bond,
  type DisputeBondDecision,
  type DisputeCase,
  type DisputeEvent
} from "@valyria/domain";
import type { XrplGateway } from "../adapters/xrpl/xrpl-gateway";
import type { EventBus } from "../lib/event-bus";
import { resolveAuditActorUserId } from "./audit-actor";
import type { PlatformRepository } from "./platform-repository";

function addUtcDays(value: string, days: number): string {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export class DisputeService {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly xrplGateway: XrplGateway,
    private readonly eventBus?: EventBus
  ) {}

  async listDisputes(): Promise<DisputeCase[]> {
    return this.repository.listDisputes();
  }

  async openDispute(input: {
    redeemId: string;
    openedByUserId: string;
    reason: string;
    evidenceUri?: string;
  }): Promise<DisputeCase> {
    const redeem = await this.repository.getRedeem(input.redeemId);

    if (!redeem) {
      throw new NotFoundError("Redeem request", input.redeemId);
    }

    if (redeem.state === "closed") {
      throw new ValidationError("Closed redeems cannot be disputed.");
    }

    const activeDispute = (await this.repository.listDisputes()).find(
      (dispute) =>
        dispute.redeemId === redeem.id &&
        (dispute.state === "opened" || dispute.state === "under_review" || dispute.state === "escalated")
    );

    if (activeDispute) {
      throw new ConflictError("Redeem already has an active dispute.");
    }

    const offer = await this.repository.getOffer(redeem.offerId);
    const producerBond = offer ? await this.resolveOperationalBond(offer.producerId) : undefined;
    const now = new Date().toISOString();
    const dispute = createDisputeCase({
      id: crypto.randomUUID(),
      redeemId: redeem.id,
      openedByUserId: input.openedByUserId,
      reason: input.reason,
      ...(producerBond ? { bondId: producerBond.id } : {}),
      slaDueAt: addUtcDays(now, getDisputeTierSlaDays("tier_1")),
      ...(input.evidenceUri ? { evidenceUri: input.evidenceUri } : {})
    });

    const savedDispute = await this.repository.upsertDispute(dispute);
    await this.repository.upsertRedeem({
      ...redeem,
      state: "disputed"
    });
    const frozenBond = producerBond ? await this.freezeBondIfNeeded(producerBond, savedDispute.id) : undefined;

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: input.openedByUserId,
      action: "dispute.opened",
      entityType: "dispute",
      entityId: savedDispute.id,
      payload: {
        redeemId: redeem.id,
        ...(frozenBond ? { bondId: frozenBond.id, bondState: frozenBond.state } : {})
      },
      createdAt: now
    });

    this.eventBus?.emit("dispute.state_changed", { disputeId: savedDispute.id, from: "none", to: "opened" });

    return savedDispute;
  }

  async transitionDispute(input: {
    disputeId: string;
    event: DisputeEvent;
    actorUserId?: string;
    resolutionSummary?: string;
    bondDecision?: DisputeBondDecision;
    slashPercentage?: number;
  }): Promise<{
    dispute: DisputeCase;
    bond?: Bond;
  }> {
    const dispute = await this.repository.getDispute(input.disputeId);

    if (!dispute) {
      throw new NotFoundError("Dispute", input.disputeId);
    }

    const nextState = transitionDisputeState(dispute.state, input.event);
    const now = new Date().toISOString();
    const nextTier = input.event === "escalate" ? escalateDisputeTier(dispute.tier) : dispute.tier;

    if ((input.event === "resolve" || input.event === "reject") && !input.resolutionSummary?.trim()) {
      throw new ValidationError("Resolution summary is required when closing a dispute.");
    }

    const bondDecision =
      input.event === "resolve"
        ? input.bondDecision ?? "restore_lock"
        : input.event === "reject"
          ? "restore_lock"
          : dispute.bondDecision;
    const updatedDispute = await this.repository.upsertDispute({
      ...dispute,
      state: nextState,
      tier: nextTier,
      updatedAt: now,
      ...(nextTier !== dispute.tier ? { slaDueAt: addUtcDays(now, getDisputeTierSlaDays(nextTier)) } : {}),
      ...(bondDecision ? { bondDecision } : {}),
      ...(input.event === "resolve" || input.event === "reject" ? { resolvedAt: now } : {}),
      ...(input.resolutionSummary?.trim() ? { resolutionSummary: input.resolutionSummary.trim() } : {})
    });

    const bond = dispute.bondId ? await this.repository.getBond(dispute.bondId) : undefined;
    const redeem = await this.repository.getRedeem(dispute.redeemId);
    let updatedBond: Bond | undefined;
    const actorUserId = await resolveAuditActorUserId(this.repository, input.actorUserId);

    if (bond && (input.event === "resolve" || input.event === "reject")) {
      const bondEvent =
        bondDecision === "slash_partial"
          ? "slash_partial"
          : bondDecision === "forfeit"
            ? "forfeit"
            : "restore_lock";

      if (bondDecision === "slash_partial" && typeof input.slashPercentage !== "number") {
        throw new ValidationError("slashPercentage is required when bondDecision is slash_partial.");
      }

      const nextBondState = transitionBondState(bond.state, bondEvent);
      const { frozenAt: _previousFrozenAt, ...bondWithoutFrozenAt } = bond;
      const slashAmount =
        bondDecision === "slash_partial" && typeof input.slashPercentage === "number"
          ? bond.amount * (input.slashPercentage / 100)
          : 0;
      const newSlashedAmount = bond.slashedAmount + slashAmount;

      // XRPL escrow não suporta finish parcial — finish total + dois Payments separados
      if (bondDecision === "slash_partial" && typeof bond.escrowSequence === "number") {
        const bondUser = await this.repository.getUser(bond.userId);
        if (!bondUser?.walletAddress) {
          throw new ValidationError("Bond owner must have a linked wallet for on-chain slash.");
        }
        // EscrowFinish libera o valor total do escrow de volta ao owner
        await this.xrplGateway.submitBondEscrowFinish({
          sourceWalletAddress: this.xrplGateway.getAccountTopology().bondVault,
          owner: bondUser.walletAddress,
          offerSequence: bond.escrowSequence,
          ...(bond.escrowCondition ? { condition: bond.escrowCondition } : {})
        });
      }

      if (bondDecision === "forfeit" && typeof bond.escrowSequence === "number") {
        const bondUser = await this.repository.getUser(bond.userId);
        if (!bondUser?.walletAddress) {
          throw new ValidationError("Bond owner must have a linked wallet for on-chain forfeit.");
        }
        // EscrowCancel devolve o valor — treasury recebe via lógica de settlement separada
        await this.xrplGateway.submitBondEscrowCancel({
          sourceWalletAddress: this.xrplGateway.getAccountTopology().bondVault,
          owner: bondUser.walletAddress,
          offerSequence: bond.escrowSequence
        });
      }

      updatedBond = await this.repository.upsertBond({
        ...bondWithoutFrozenAt,
        state: nextBondState,
        slashedAmount: newSlashedAmount,
        updatedAt: now,
        ...(nextBondState === "frozen" ? { frozenAt: now } : {})
      });
    }

    if (redeem && (input.event === "resolve" || input.event === "reject")) {
      await this.repository.upsertRedeem({
        ...redeem,
        state: "closed",
        ...(redeem.closedAt ? {} : { closedAt: now })
      });

      const offer = await this.repository.getOffer(redeem.offerId);

      if (offer) {
        await this.repository.upsertOffer({
          ...offer,
          status: "settled",
          updatedAt: now
        });
      }
    }

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(actorUserId ? { actorUserId } : {}),
      action: `dispute.transition.${input.event}`,
      entityType: "dispute",
      entityId: updatedDispute.id,
      payload: {
        from: dispute.state,
        to: nextState,
        tier: updatedDispute.tier,
        ...(bondDecision ? { bondDecision } : {}),
        ...(updatedBond ? { bondId: updatedBond.id, bondState: updatedBond.state } : {}),
        ...(typeof input.slashPercentage === "number"
          ? { slashPercentage: input.slashPercentage, slashAmount: bond!.amount * (input.slashPercentage / 100) }
          : {})
      },
      createdAt: now
    });

    this.eventBus?.emit("dispute.state_changed", { disputeId: updatedDispute.id, from: dispute.state, to: nextState });

    return {
      dispute: updatedDispute,
      ...(updatedBond ? { bond: updatedBond } : {})
    };
  }

  private async resolveOperationalBond(userId: string): Promise<Bond | undefined> {
    const bonds = await this.repository.listBonds();
    return bonds.find(
      (bond) =>
        bond.userId === userId &&
        (bond.state === "locked" || bond.state === "frozen" || bond.state === "partially_slashed")
    );
  }

  private async freezeBondIfNeeded(bond: Bond, disputeId: string): Promise<Bond> {
    if (bond.state === "frozen") {
      return bond;
    }

    const now = new Date().toISOString();
    const nextState = transitionBondState(bond.state, "freeze");
    const frozenBond = await this.repository.upsertBond({
      ...bond,
      state: nextState,
      updatedAt: now,
      frozenAt: now
    });

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: bond.userId,
      action: "bond.frozen_for_dispute",
      entityType: "bond",
      entityId: frozenBond.id,
      payload: {
        disputeId,
        from: bond.state,
        to: frozenBond.state
      },
      createdAt: now
    });

    return frozenBond;
  }
}
