export interface ProofNftIntent {
  ownerWallet: string;
  uri: string;
  taxon: number;
  preflightChecks: string[];
  notes: string[];
}

export function buildProofNftIntent(input: {
  ownerWallet: string;
  uri: string;
  taxon: number;
}): ProofNftIntent {
  if (!input.uri || input.uri.trim().length === 0) {
    throw new Error("Proof NFT URI must not be empty.");
  }

  if (!Number.isInteger(input.taxon) || input.taxon < 0 || input.taxon >= 0x80000000) {
    throw new Error("Proof NFT taxon must be an integer between 0 and 2147483647.");
  }

  return {
    ownerWallet: input.ownerWallet,
    uri: input.uri,
    taxon: input.taxon,
    preflightChecks: [
      "validated_ledger_read",
      "owner_wallet_signed",
      "manifest_hash_computed",
      "uri_hex_encoded"
    ],
    notes: [
      "Proof NFTs should anchor canonical proof URIs or IPFS CIDs for audit and dispute flows.",
      "Mint receipts should be reconciled with NFTokenID before exposing the artifact as on-ledger."
    ]
  };
}
