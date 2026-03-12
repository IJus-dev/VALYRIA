export type CredentialKind = "KYCApproved" | "ProducerApproved";

export type CredentialStatus = "created" | "accepted" | "revoked" | "expired";

export interface CredentialRecord {
  id: string;
  userId: string;
  kind: CredentialKind;
  status: CredentialStatus;
  issuerWallet?: string;
  subjectWallet?: string;
  ledgerCredentialId?: string;
  expiresAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function createCredentialRecord(input: {
  id: string;
  userId: string;
  kind: CredentialKind;
  issuerWallet?: string;
  subjectWallet?: string;
  ledgerCredentialId?: string;
  status?: CredentialStatus;
  expiresAt?: string;
  createdAt?: string;
}): CredentialRecord {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: input.id,
    userId: input.userId,
    kind: input.kind,
    status: input.status ?? "created",
    ...(input.issuerWallet ? { issuerWallet: input.issuerWallet } : {}),
    ...(input.subjectWallet ? { subjectWallet: input.subjectWallet } : {}),
    ...(input.ledgerCredentialId ? { ledgerCredentialId: input.ledgerCredentialId } : {}),
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    createdAt,
    updatedAt: createdAt
  };
}
