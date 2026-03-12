import { createCredentialRecord, transitionUserState, NotFoundError, ValidationError, AuthorizationError, type CredentialKind, type CredentialRecord, type PlatformUser } from "@valyria/domain";
import type { CredentialCreateIntent } from "@valyria/xrpl";
import type {
  CredentialAcceptSubmission,
  CredentialCreateSubmission,
  XrplGateway
} from "../adapters/xrpl/xrpl-gateway";
import type { PlatformRepository } from "./platform-repository";

function deriveNextUserState(user: PlatformUser, kind: CredentialKind): PlatformUser["state"] {
  if (kind === "KYCApproved") {
    if (user.state === "kyc_approved" || user.state === "producer_approved") {
      return user.state;
    }

    if (user.state === "kyc_pending") {
      return transitionUserState(user.state, "approve_kyc");
    }

    throw new ValidationError("User must be in kyc_pending before accepting KYCApproved.");
  }

  if (kind === "ProducerApproved") {
    if (user.state === "producer_approved") {
      return user.state;
    }

    if (user.state === "kyc_approved") {
      return transitionUserState(user.state, "approve_producer");
    }

    throw new ValidationError("User must be in kyc_approved before accepting ProducerApproved.");
  }

  return user.state;
}

export class CredentialService {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly xrplGateway: XrplGateway
  ) {}

  async listCredentials(userId?: string): Promise<CredentialRecord[]> {
    return this.repository.listCredentials(userId);
  }

  previewCredentialCreate(input: {
    subjectWallet: string;
    credentialType: string;
    expiresAt?: string;
  }): CredentialCreateIntent {
    return this.xrplGateway.previewCredentialCreate(input);
  }

  async issueCredential(input: {
    userId: string;
    kind: CredentialKind;
    expiresAt?: string;
  }): Promise<{
    credential: CredentialRecord;
    preview: CredentialCreateIntent;
    ledger?: CredentialCreateSubmission["receipt"];
  }> {
    const user = await this.repository.getUser(input.userId);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (!user.walletAddress) {
      throw new ValidationError("User must have a linked wallet before credential issuance.");
    }

    const ledgerSubmission = await this.xrplGateway.submitCredentialCreate({
      subjectWallet: user.walletAddress,
      credentialType: input.kind,
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {})
    });
    const preview = ledgerSubmission.intent;
    const existingCredential = (await this.repository.listCredentials(user.id)).find((record) => {
      if (record.kind !== input.kind || record.subjectWallet !== user.walletAddress) {
        return false;
      }

      if (ledgerSubmission.credentialLedgerIndex) {
        return record.ledgerCredentialId === ledgerSubmission.credentialLedgerIndex;
      }

      return record.status === "created";
    });
    const now = new Date().toISOString();

    const credential = existingCredential
      ? {
          ...existingCredential,
          issuerWallet: this.xrplGateway.getAccountTopology().kycIssuer,
          subjectWallet: user.walletAddress,
          ...(ledgerSubmission.credentialLedgerIndex
            ? { ledgerCredentialId: ledgerSubmission.credentialLedgerIndex }
            : {}),
          ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
          updatedAt: now
        }
      : createCredentialRecord({
          id: crypto.randomUUID(),
          userId: user.id,
          kind: input.kind,
          issuerWallet: this.xrplGateway.getAccountTopology().kycIssuer,
          subjectWallet: user.walletAddress,
          ...(ledgerSubmission.credentialLedgerIndex
            ? { ledgerCredentialId: ledgerSubmission.credentialLedgerIndex }
            : {}),
          ...(input.expiresAt ? { expiresAt: input.expiresAt } : {})
        });

    const savedCredential = await this.repository.upsertCredential(credential);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: user.id,
      action: "credential.created",
      entityType: "credential",
      entityId: savedCredential.id,
      payload: {
        kind: savedCredential.kind,
        subjectWallet: savedCredential.subjectWallet,
        xrplMode: ledgerSubmission.receipt.mode,
        submitted: ledgerSubmission.receipt.submitted,
        ...(ledgerSubmission.receipt.hash ? { hash: ledgerSubmission.receipt.hash } : {}),
        ...(ledgerSubmission.credentialLedgerIndex
          ? { credentialLedgerIndex: ledgerSubmission.credentialLedgerIndex }
          : {})
      },
      createdAt: new Date().toISOString()
    });

    return {
      credential: savedCredential,
      preview,
      ledger: ledgerSubmission.receipt
    };
  }

  async acceptCredential(input: {
    credentialId: string;
    ledgerCredentialId?: string;
    walletSeed?: string;
  }): Promise<{
    credential: CredentialRecord;
    user: PlatformUser;
    ledger?: CredentialAcceptSubmission["receipt"];
  }> {
    const credential = await this.repository.getCredential(input.credentialId);

    if (!credential) {
      throw new NotFoundError("Credential");
    }

    const user = await this.repository.getUser(credential.userId);

    if (!user) {
      throw new NotFoundError("User");
    }

    const subjectWalletAddress = credential.subjectWallet ?? user.walletAddress;

    if (!subjectWalletAddress) {
      throw new ValidationError("Credential subject wallet is required before acceptance.");
    }

    const ledgerSubmission = await this.xrplGateway.submitCredentialAccept({
      subjectWalletAddress,
      subjectWalletSeed: input.walletSeed,
      issuerWallet: credential.issuerWallet ?? this.xrplGateway.getAccountTopology().kycIssuer,
      credentialType: credential.kind
    });

    const now = new Date().toISOString();
    const resolvedLedgerCredentialId =
      input.ledgerCredentialId ??
      ledgerSubmission.credentialLedgerIndex ??
      credential.ledgerCredentialId;

    if (!resolvedLedgerCredentialId) {
      throw new ValidationError("ledgerCredentialId is required when the credential has no XRPL ledger index yet.");
    }

    const updatedCredential: CredentialRecord = {
      ...credential,
      ledgerCredentialId: resolvedLedgerCredentialId,
      status: "accepted",
      acceptedAt: now,
      updatedAt: now
    };

    const savedCredential = await this.repository.upsertCredential(updatedCredential);

    const updatedUser: PlatformUser = {
      ...user,
      state: deriveNextUserState(user, credential.kind),
      updatedAt: now
    };

    const savedUser = await this.repository.upsertUser(updatedUser);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      actorUserId: savedUser.id,
      action: "credential.accepted",
      entityType: "credential",
      entityId: savedCredential.id,
      payload: {
        ledgerCredentialId: savedCredential.ledgerCredentialId,
        newUserState: savedUser.state,
        xrplMode: ledgerSubmission.receipt.mode,
        submitted: ledgerSubmission.receipt.submitted,
        ...(ledgerSubmission.receipt.hash ? { hash: ledgerSubmission.receipt.hash } : {})
      },
      createdAt: now
    });

    return {
      credential: savedCredential,
      user: savedUser,
      ledger: ledgerSubmission.receipt
    };
  }

  async acceptCredentialForUser(input: {
    actorUserId: string;
    credentialId: string;
    ledgerCredentialId?: string;
    walletSeed?: string;
  }): Promise<{
    credential: CredentialRecord;
    user: PlatformUser;
    ledger?: CredentialAcceptSubmission["receipt"];
  }> {
    const credential = await this.repository.getCredential(input.credentialId);

    if (!credential) {
      throw new NotFoundError("Credential");
    }

    if (credential.userId !== input.actorUserId) {
      throw new AuthorizationError("Credential does not belong to the authenticated user.");
    }

    return this.acceptCredential({
      credentialId: input.credentialId,
      ...(input.ledgerCredentialId ? { ledgerCredentialId: input.ledgerCredentialId } : {}),
      ...(input.walletSeed ? { walletSeed: input.walletSeed } : {})
    });
  }
}
