import type {
  AmmPool,
  Bond,
  CredentialRecord,
  DisputeCase,
  FeeRecord,
  Offer,
  OraclePricePoint,
  PlatformUser,
  Proposal,
  ProofArtifact,
  RedeemRequest
} from "@valyria/domain";

export interface WalletChallengeRecord {
  id: string;
  userId: string;
  walletAddress: string;
  nonce: string;
  message: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformRepository {
  listUsers(): Promise<PlatformUser[]>;
  getUser(id: string): Promise<PlatformUser | undefined>;
  getUserByEmail(email: string): Promise<PlatformUser | undefined>;
  upsertUser(user: PlatformUser): Promise<PlatformUser>;
  listAmmPools(): Promise<AmmPool[]>;
  getAmmPool(id: string): Promise<AmmPool | undefined>;
  upsertAmmPool(pool: AmmPool): Promise<AmmPool>;
  listBonds(): Promise<Bond[]>;
  getBond(id: string): Promise<Bond | undefined>;
  upsertBond(bond: Bond): Promise<Bond>;
  findLockedBondByUser(userId: string): Promise<Bond | undefined>;
  listOffers(): Promise<Offer[]>;
  getOffer(id: string): Promise<Offer | undefined>;
  upsertOffer(offer: Offer): Promise<Offer>;
  listRedeems(): Promise<RedeemRequest[]>;
  getRedeem(id: string): Promise<RedeemRequest | undefined>;
  upsertRedeem(redeem: RedeemRequest): Promise<RedeemRequest>;
  listCredentials(userId?: string): Promise<CredentialRecord[]>;
  getCredential(id: string): Promise<CredentialRecord | undefined>;
  upsertCredential(credential: CredentialRecord): Promise<CredentialRecord>;
  listOraclePrices(symbol?: string): Promise<OraclePricePoint[]>;
  createOraclePrice(price: OraclePricePoint): Promise<OraclePricePoint>;
  listProofs(offerId?: string): Promise<ProofArtifact[]>;
  getProof(id: string): Promise<ProofArtifact | undefined>;
  upsertProof(proof: ProofArtifact): Promise<ProofArtifact>;
  listDisputes(): Promise<DisputeCase[]>;
  getDispute(id: string): Promise<DisputeCase | undefined>;
  upsertDispute(dispute: DisputeCase): Promise<DisputeCase>;
  createWalletChallenge(challenge: WalletChallengeRecord): Promise<WalletChallengeRecord>;
  getWalletChallenge(id: string): Promise<WalletChallengeRecord | undefined>;
  markWalletChallengeUsed(id: string, usedAt: string): Promise<WalletChallengeRecord>;
  createAuditLog(entry: AuditLogEntry): Promise<AuditLogEntry>;
  listAuditLogs(limit?: number): Promise<AuditLogEntry[]>;
  listProposals(): Promise<Proposal[]>;
  getProposal(id: string): Promise<Proposal | undefined>;
  upsertProposal(proposal: Proposal): Promise<Proposal>;
  deleteProposal(id: string): Promise<void>;
  createFeeRecord(fee: FeeRecord): Promise<FeeRecord>;
  listFeeRecords(entityType?: string, entityId?: string): Promise<FeeRecord[]>;
}
