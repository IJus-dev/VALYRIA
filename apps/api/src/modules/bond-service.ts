import {
  canOperateOnChain,
  createBond,
  transitionBondState,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  type Bond,
  type BondEvent
} from "@valyria/domain";
import type { BondDepositIntent } from "@valyria/xrpl";
import type {
  BondEscrowCreateSubmission,
  XrplGateway,
  XrplSubmissionReceipt
} from "../adapters/xrpl/xrpl-gateway";
import type { EventBus } from "../lib/event-bus";
import { resolveAuditActorUserId } from "./audit-actor";
import type { PlatformRepository } from "./platform-repository";

// Default: escrow libera após 90 dias
const DEFAULT_ESCROW_DAYS = 90;

export class BondService {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly xrplGateway: XrplGateway,
    private readonly eventBus?: EventBus
  ) {}

  async listBonds(): Promise<Bond[]> {
    return this.repository.listBonds();
  }

  previewDeposit(input: {
    amount: number;
    credentialIds: string[];
    issuer?: string;
  }): BondDepositIntent {
    return this.xrplGateway.previewBondDeposit(input);
  }

  async createBond(input: {
    userId: string;
    amount: number;
    credentialIds: string[];
    walletSeed?: string;
    finishAfterDays?: number;
    condition?: string;
  }): Promise<{
    bond: Bond;
    ledger: XrplSubmissionReceipt;
  }> {
    const user = await this.repository.getUser(input.userId);

    if (!user) {
      throw new NotFoundError("User", input.userId);
    }

    if (!canOperateOnChain(user.state)) {
      throw new AuthorizationError("User is not approved for on-chain operations.");
    }

    if (!user.walletAddress) {
      throw new ValidationError("User must have a linked wallet before creating a real bond deposit.");
    }

    const credentials = await Promise.all(
      input.credentialIds.map(async (credentialId) => {
        const credential = await this.repository.getCredential(credentialId);

        if (!credential) {
          throw new NotFoundError("Credential", credentialId);
        }

        if (credential.userId !== user.id) {
          throw new AuthorizationError(`Credential ${credentialId} does not belong to user ${user.id}.`);
        }

        if (credential.status !== "accepted") {
          throw new ValidationError(`Credential ${credentialId} must be accepted before bond deposit.`);
        }

        if (!credential.ledgerCredentialId) {
          throw new ValidationError(`Credential ${credentialId} does not have a ledger credential index yet.`);
        }

        return credential;
      })
    );

    const topology = this.xrplGateway.getAccountTopology();
    const days = input.finishAfterDays ?? DEFAULT_ESCROW_DAYS;
    const finishAfter = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    // Persist before submit — salva bond como pending antes do XRPL call
    const pendingBond = createBond({
      id: crypto.randomUUID(),
      userId: input.userId,
      amount: input.amount,
      credentialIds: input.credentialIds,
      state: "pending",
      escrowFinishAfter: finishAfter,
      ...(input.condition ? { escrowCondition: input.condition } : {})
    });

    await this.repository.upsertBond(pendingBond);

    // EscrowCreate em vez de Payment — valor fica travado on-chain
    const escrowSubmission: BondEscrowCreateSubmission = await this.xrplGateway.submitBondEscrowCreate({
      sourceWalletAddress: user.walletAddress,
      ...(input.walletSeed ? { sourceWalletSeed: input.walletSeed } : {}),
      destinationAddress: topology.bondVault,
      amount: input.amount.toString(),
      finishAfter,
      ...(input.condition ? { condition: input.condition } : {}),
      credentialIds: credentials.map((credential) => credential.ledgerCredentialId as string)
    });

    // Atualiza bond com dados do escrow após submissão
    const updatedBond: Bond = {
      ...pendingBond,
      state: escrowSubmission.receipt.submitted ? "locked" : "pending",
      ...(escrowSubmission.receipt.hash ? { ledgerHash: escrowSubmission.receipt.hash } : {}),
      ...(typeof escrowSubmission.receipt.ledgerIndex === "number"
        ? { ledgerSequence: escrowSubmission.receipt.ledgerIndex }
        : {}),
      ...(typeof escrowSubmission.escrowSequence === "number"
        ? { escrowSequence: escrowSubmission.escrowSequence }
        : {}),
      ...(escrowSubmission.receipt.hash ? { escrowLedgerHash: escrowSubmission.receipt.hash } : {}),
      updatedAt: new Date().toISOString(),
      ...(escrowSubmission.receipt.submitted ? { lockedAt: new Date().toISOString() } : {})
    };

    const savedBond = await this.repository.upsertBond(updatedBond);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: user.id,
      action: "bond.created",
      entityType: "bond",
      entityId: savedBond.id,
      payload: {
        amount: savedBond.amount,
        currency: savedBond.currency,
        xrplMode: escrowSubmission.receipt.mode,
        submitted: escrowSubmission.receipt.submitted,
        escrowSequence: escrowSubmission.escrowSequence,
        finishAfter,
        ...(escrowSubmission.receipt.hash ? { hash: escrowSubmission.receipt.hash } : {}),
        ...(typeof escrowSubmission.receipt.ledgerIndex === "number"
          ? { ledgerIndex: escrowSubmission.receipt.ledgerIndex }
          : {})
      },
      createdAt: new Date().toISOString()
    });

    this.eventBus?.emit("bond.state_changed", { bondId: savedBond.id, from: "pending", to: savedBond.state, actorUserId: user.id });

    return {
      bond: savedBond,
      ledger: escrowSubmission.receipt
    };
  }

  // EscrowFinish — libera o valor travado de volta ao produtor
  async releaseBond(input: {
    bondId: string;
    actorUserId?: string;
    walletSeed?: string;
  }): Promise<Bond> {
    const bond = await this.repository.getBond(input.bondId);

    if (!bond) {
      throw new NotFoundError("Bond", input.bondId);
    }

    // Valida que o bond pode ser released pela state machine
    const nextState = transitionBondState(bond.state, "release");

    if (typeof bond.escrowSequence !== "number") {
      throw new ValidationError("Bond does not have an escrow sequence — cannot release on-chain.");
    }

    const user = await this.repository.getUser(bond.userId);

    if (!user?.walletAddress) {
      throw new ValidationError("Bond owner must have a linked wallet.");
    }

    const topology = this.xrplGateway.getAccountTopology();

    // EscrowFinish libera o valor total do escrow
    const finishSubmission = await this.xrplGateway.submitBondEscrowFinish({
      sourceWalletAddress: topology.bondVault,
      ...(input.walletSeed ? { sourceWalletSeed: input.walletSeed } : {}),
      owner: user.walletAddress,
      offerSequence: bond.escrowSequence,
      ...(bond.escrowCondition ? { condition: bond.escrowCondition } : {})
    });

    const updatedBond: Bond = {
      ...bond,
      state: nextState,
      updatedAt: new Date().toISOString()
    };

    const savedBond = await this.repository.upsertBond(updatedBond);
    const actorUserId = await resolveAuditActorUserId(this.repository, input.actorUserId);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(actorUserId ? { actorUserId } : {}),
      action: "bond.released",
      entityType: "bond",
      entityId: savedBond.id,
      payload: {
        from: bond.state,
        to: nextState,
        escrowSequence: bond.escrowSequence,
        xrplMode: finishSubmission.receipt.mode,
        ...(finishSubmission.receipt.hash ? { hash: finishSubmission.receipt.hash } : {})
      },
      createdAt: new Date().toISOString()
    });

    this.eventBus?.emit("bond.state_changed", { bondId: savedBond.id, from: bond.state, to: nextState, actorUserId });

    return savedBond;
  }

  // EscrowCancel — confisca o escrow (forfeiture)
  async forfeitBond(input: {
    bondId: string;
    actorUserId?: string;
    walletSeed?: string;
  }): Promise<Bond> {
    const bond = await this.repository.getBond(input.bondId);

    if (!bond) {
      throw new NotFoundError("Bond", input.bondId);
    }

    const nextState = transitionBondState(bond.state, "forfeit");

    if (typeof bond.escrowSequence !== "number") {
      throw new ValidationError("Bond does not have an escrow sequence — cannot forfeit on-chain.");
    }

    const user = await this.repository.getUser(bond.userId);

    if (!user?.walletAddress) {
      throw new ValidationError("Bond owner must have a linked wallet.");
    }

    const topology = this.xrplGateway.getAccountTopology();

    // EscrowCancel — cancela o escrow, devolvendo os fundos
    const cancelSubmission = await this.xrplGateway.submitBondEscrowCancel({
      sourceWalletAddress: topology.bondVault,
      ...(input.walletSeed ? { sourceWalletSeed: input.walletSeed } : {}),
      owner: user.walletAddress,
      offerSequence: bond.escrowSequence
    });

    const updatedBond: Bond = {
      ...bond,
      state: nextState,
      updatedAt: new Date().toISOString()
    };

    const savedBond = await this.repository.upsertBond(updatedBond);
    const actorUserId = await resolveAuditActorUserId(this.repository, input.actorUserId);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(actorUserId ? { actorUserId } : {}),
      action: "bond.forfeited",
      entityType: "bond",
      entityId: savedBond.id,
      payload: {
        from: bond.state,
        to: nextState,
        escrowSequence: bond.escrowSequence,
        xrplMode: cancelSubmission.receipt.mode,
        ...(cancelSubmission.receipt.hash ? { hash: cancelSubmission.receipt.hash } : {})
      },
      createdAt: new Date().toISOString()
    });

    this.eventBus?.emit("bond.state_changed", { bondId: savedBond.id, from: bond.state, to: nextState, actorUserId });

    return savedBond;
  }

  async transitionBond(input: {
    bondId: string;
    event: BondEvent;
    actorUserId?: string;
  }): Promise<Bond> {
    const bond = await this.repository.getBond(input.bondId);

    if (!bond) {
      throw new NotFoundError("Bond", input.bondId);
    }

    const nextState = transitionBondState(bond.state, input.event);
    const { frozenAt: _previousFrozenAt, ...bondWithoutFrozenAt } = bond;
    const updatedBond: Bond = {
      ...bondWithoutFrozenAt,
      state: nextState,
      updatedAt: new Date().toISOString(),
      ...(nextState === "locked" ? { lockedAt: new Date().toISOString() } : {}),
      ...(nextState === "frozen" ? { frozenAt: new Date().toISOString() } : {})
    };

    const savedBond = await this.repository.upsertBond(updatedBond);
    const actorUserId = await resolveAuditActorUserId(this.repository, input.actorUserId);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(actorUserId ? { actorUserId } : {}),
      action: `bond.transition.${input.event}`,
      entityType: "bond",
      entityId: savedBond.id,
      payload: {
        from: bond.state,
        to: nextState
      },
      createdAt: new Date().toISOString()
    });

    this.eventBus?.emit("bond.state_changed", { bondId: savedBond.id, from: bond.state, to: nextState, actorUserId });

    return savedBond;
  }
}
