export interface CredentialCreateIntent {
  subjectWallet: string;
  issuerWallet: string;
  credentialType: string;
  expiresAt?: string;
  preflightChecks: string[];
  notes: string[];
}

export function buildCredentialCreateIntent(input: {
  subjectWallet: string;
  issuerWallet: string;
  credentialType: string;
  expiresAt?: string;
}): CredentialCreateIntent {
  return {
    subjectWallet: input.subjectWallet,
    issuerWallet: input.issuerWallet,
    credentialType: input.credentialType,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    preflightChecks: [
      "validated_ledger_read",
      "subject_wallet_present",
      "issuer_multisig_policy"
    ],
    notes: [
      "CredentialCreate must be followed by CredentialAccept before enabling operations.",
      "Keep issuer and subject wallets segregated from application sessions."
    ]
  };
}
