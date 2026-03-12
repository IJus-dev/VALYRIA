export type ProofArtifactType =
  | "underwriting_report"
  | "farm_document"
  | "geo_photo"
  | "delivery_receipt"
  | "dispute_evidence";

export interface ProofArtifact {
  id: string;
  userId?: string;
  offerId?: string;
  artifactType: ProofArtifactType;
  commodity: string;
  uri: string;
  ipfsCid?: string;
  manifestHash?: string;
  nftTokenId?: string;
  nftIssuerWallet?: string;
  nftUri?: string;
  nftMintHash?: string;
  nftMintLedgerSequence?: number;
  nftMintedAt?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
}

export function createProofArtifact(input: {
  id: string;
  userId?: string;
  offerId?: string;
  artifactType: ProofArtifactType;
  commodity: string;
  uri: string;
  ipfsCid?: string;
  manifestHash?: string;
  nftTokenId?: string;
  nftIssuerWallet?: string;
  nftUri?: string;
  nftMintHash?: string;
  nftMintLedgerSequence?: number;
  nftMintedAt?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt?: string;
}): ProofArtifact {
  return {
    id: input.id,
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.offerId ? { offerId: input.offerId } : {}),
    artifactType: input.artifactType,
    commodity: input.commodity,
    uri: input.uri,
    ...(input.ipfsCid ? { ipfsCid: input.ipfsCid } : {}),
    ...(input.manifestHash ? { manifestHash: input.manifestHash } : {}),
    ...(input.nftTokenId ? { nftTokenId: input.nftTokenId } : {}),
    ...(input.nftIssuerWallet ? { nftIssuerWallet: input.nftIssuerWallet } : {}),
    ...(input.nftUri ? { nftUri: input.nftUri } : {}),
    ...(input.nftMintHash ? { nftMintHash: input.nftMintHash } : {}),
    ...(typeof input.nftMintLedgerSequence === "number"
      ? { nftMintLedgerSequence: input.nftMintLedgerSequence }
      : {}),
    ...(input.nftMintedAt ? { nftMintedAt: input.nftMintedAt } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}
