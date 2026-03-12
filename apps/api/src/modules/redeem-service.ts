import { createRedeemRequest, transitionRedeemState, createFeeRecord, FEE_RATES, NotFoundError, AuthorizationError, ValidationError, ConflictError, type Offer, type RedeemEvent, type RedeemRequest } from "@valyria/domain";
import type { XrplGateway } from "../adapters/xrpl/xrpl-gateway";
import type { EventBus } from "../lib/event-bus";
import { resolveAuditActorUserId } from "./audit-actor";
import type { PlatformRepository } from "./platform-repository";

const commodityResponseWindowDays: Record<string, number> = {
  MLH: 5,
  SOJ: 5,
  TRG: 5,
  ARZ: 6,
  FEJ: 6,
  CAF: 7,
  ACR: 7,
  ALG: 7
};

function resolveResponseWindowDays(commodity: string, override?: number): number {
  if (typeof override === "number") {
    return override;
  }

  return commodityResponseWindowDays[commodity] ?? 5;
}

export class RedeemService {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly xrplGateway: XrplGateway,
    private readonly eventBus?: EventBus
  ) {}

  async listRedeems(): Promise<RedeemRequest[]> {
    return this.repository.listRedeems();
  }

  async getRedeem(redeemId: string): Promise<RedeemRequest> {
    const redeem = await this.repository.getRedeem(redeemId);

    if (!redeem) {
      throw new NotFoundError("Redeem request");
    }

    return redeem;
  }

  async requestRedeem(input: {
    offerId: string;
    holderId: string;
    settlementWallet: string;
    responseWindowDays?: number;
    walletSeed?: string;
  }): Promise<{
    offer: Offer;
    redeem: RedeemRequest;
  }> {
    const offer = await this.repository.getOffer(input.offerId);

    if (!offer) {
      throw new NotFoundError("Offer");
    }

    if (offer.status !== "filled") {
      throw new ValidationError("Offer must be filled before redeem can be requested.");
    }

    const holder = await this.repository.getUser(input.holderId);

    if (!holder) {
      throw new NotFoundError("Holder");
    }

    if (offer.currentHolderId !== holder.id) {
      throw new AuthorizationError("Redeem can only be requested by the current holder of the filled offer.");
    }

    const existingRedeem = (await this.repository.listRedeems()).find(
      (redeem) => redeem.offerId === offer.id && redeem.state !== "closed"
    );

    if (existingRedeem) {
      throw new ConflictError("Offer already has an active redeem workflow.");
    }

    const settlementWallet = this.xrplGateway.getAccountTopology().settlement;

    if (input.settlementWallet !== settlementWallet) {
      throw new ValidationError("Redeem settlement wallet must match the platform settlement wallet.");
    }

    if (!holder.walletAddress) {
      throw new ValidationError("Holder must have a linked wallet before opening redeem.");
    }

    const settlementSubmission = await this.xrplGateway.submitSeriesRedeem({
      holderWalletAddress: holder.walletAddress,
      ...(input.walletSeed ? { holderWalletSeed: input.walletSeed } : {}),
      destinationWalletAddress: settlementWallet,
      seriesCurrencyHex: offer.series.currencyHex,
      ...(offer.seriesIssuer ? { seriesIssuer: offer.seriesIssuer } : {}),
      quantity: offer.quantity
    });
    const now = new Date().toISOString();
    const responseWindowDays = resolveResponseWindowDays(
      offer.series.descriptor.commodity,
      input.responseWindowDays
    );
    const redeem = createRedeemRequest({
      id: crypto.randomUUID(),
      offerId: offer.id,
      holderId: holder.id,
      settlementWallet,
      ...(settlementSubmission.receipt.hash ? { settlementLedgerHash: settlementSubmission.receipt.hash } : {}),
      ...(typeof settlementSubmission.receipt.ledgerIndex === "number"
        ? { settlementLedgerSequence: settlementSubmission.receipt.ledgerIndex }
        : {}),
      settlementTransferredAt: now,
      responseWindowDays
    });

    const updatedOffer: Offer = {
      ...offer,
      status: "redeem_requested",
      updatedAt: now
    };

    const [savedOffer, savedRedeem] = await Promise.all([
      this.repository.upsertOffer(updatedOffer),
      this.repository.upsertRedeem(redeem)
    ]);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: holder.id,
      action: "redeem.requested",
      entityType: "redeem",
      entityId: savedRedeem.id,
      payload: {
        offerId: savedOffer.id,
        settlementWallet: savedRedeem.settlementWallet,
        xrplMode: settlementSubmission.receipt.mode,
        submitted: settlementSubmission.receipt.submitted,
        quantity: offer.quantity,
        seriesCurrencyHex: offer.series.currencyHex,
        responseWindowDays,
        policySource: typeof input.responseWindowDays === "number" ? "manual_override" : "commodity_default",
        ...(savedRedeem.settlementLedgerHash ? { hash: savedRedeem.settlementLedgerHash } : {}),
        ...(typeof savedRedeem.settlementLedgerSequence === "number"
          ? { ledgerIndex: savedRedeem.settlementLedgerSequence }
          : {})
      },
      createdAt: now
    });

    this.eventBus?.emit("redeem.state_changed", { redeemId: savedRedeem.id, from: "none", to: "requested" });

    return {
      offer: savedOffer,
      redeem: savedRedeem
    };
  }

  async transitionRedeem(input: {
    redeemId: string;
    event: RedeemEvent;
    actorUserId?: string;
    trackingCode?: string;
  }): Promise<{
    redeem: RedeemRequest;
    offer?: Offer;
  }> {
    const redeem = await this.getRedeem(input.redeemId);
    const nextState = transitionRedeemState(redeem.state, input.event);
    const now = new Date().toISOString();
    const trackingCode =
      input.event === "attach_tracking"
        ? input.trackingCode?.trim()
        : redeem.trackingCode;

    if (input.event === "attach_tracking" && !trackingCode) {
      throw new ValidationError("Tracking code is required when attaching logistics tracking.");
    }

    if (input.event === "ship" && !redeem.trackingCode) {
      throw new ValidationError("Tracking code must be attached before shipping.");
    }

    const updatedRedeem = await this.repository.upsertRedeem({
      ...redeem,
      state: nextState,
      ...(trackingCode ? { trackingCode } : {}),
      ...(input.event === "ship" ? { shippedAt: now } : {}),
      ...(input.event === "confirm_delivery" ? { deliveredAt: now } : {}),
      ...(input.event === "accept" ? { acceptedAt: now } : {}),
      ...(input.event === "close" ? { closedAt: now } : {})
    });

    let updatedOffer: Offer | undefined;
    const actorUserId = await resolveAuditActorUserId(this.repository, input.actorUserId);

    if (nextState === "closed") {
      const offer = await this.repository.getOffer(redeem.offerId);

      if (offer) {
        updatedOffer = await this.repository.upsertOffer({
          ...offer,
          status: "settled",
          updatedAt: now
        });

        await this.repository.createFeeRecord(
          createFeeRecord({
            id: crypto.randomUUID(),
            feeType: "settlement",
            entityType: "redeem",
            entityId: updatedRedeem.id,
            baseAmount: offer.notional,
            feeRate: FEE_RATES.SETTLEMENT_FEE_RATE
          })
        );
      }
    }

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(actorUserId ? { actorUserId } : {}),
      action: `redeem.transition.${input.event}`,
      entityType: "redeem",
      entityId: updatedRedeem.id,
      payload: {
        from: redeem.state,
        to: nextState,
        offerId: redeem.offerId,
        ...(updatedRedeem.trackingCode ? { trackingCode: updatedRedeem.trackingCode } : {}),
        ...(updatedRedeem.shippedAt ? { shippedAt: updatedRedeem.shippedAt } : {}),
        ...(updatedRedeem.deliveredAt ? { deliveredAt: updatedRedeem.deliveredAt } : {}),
        ...(updatedRedeem.acceptedAt ? { acceptedAt: updatedRedeem.acceptedAt } : {}),
        ...(updatedRedeem.closedAt ? { closedAt: updatedRedeem.closedAt } : {})
      },
      createdAt: now
    });

    this.eventBus?.emit("redeem.state_changed", { redeemId: updatedRedeem.id, from: redeem.state, to: nextState });

    return {
      redeem: updatedRedeem,
      ...(updatedOffer ? { offer: updatedOffer } : {})
    };
  }

}
