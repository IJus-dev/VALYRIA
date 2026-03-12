import {
  createAmmPool,
  createBond,
  createCredentialRecord,
  createDisputeCase,
  createOffer,
  createOraclePricePoint,
  createProofArtifact,
  createProposal,
  createRedeemRequest,
  createUser,
  type AmmPool,
  type Bond,
  type CredentialRecord,
  type DisputeCase,
  type FeeRecord,
  type Offer,
  type OraclePricePoint,
  type PlatformUser,
  type Proposal,
  type ProofArtifact,
  type RedeemRequest
} from "@valyria/domain";
import type { AuditLogEntry, PlatformRepository, WalletChallengeRecord } from "../../modules/platform-repository";

const SEEDED_AT = "2026-03-07T00:00:00.000Z";

export class InMemoryPlatformRepository implements PlatformRepository {
  private readonly users = new Map<string, PlatformUser>();
  private readonly ammPools = new Map<string, AmmPool>();
  private readonly bonds = new Map<string, Bond>();
  private readonly offers = new Map<string, Offer>();
  private readonly redeems = new Map<string, RedeemRequest>();
  private readonly credentials = new Map<string, CredentialRecord>();
  private readonly proofs = new Map<string, ProofArtifact>();
  private readonly oraclePrices = new Map<string, OraclePricePoint>();
  private readonly disputes = new Map<string, DisputeCase>();
  private readonly proposals = new Map<string, Proposal>();
  private readonly walletChallenges = new Map<string, WalletChallengeRecord>();
  private readonly auditLogs = new Map<string, AuditLogEntry>();
  private feeRecords: FeeRecord[] = [];

  constructor() {
    this.seed();
  }

  async listUsers(): Promise<PlatformUser[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<PlatformUser | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<PlatformUser | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async upsertUser(user: PlatformUser): Promise<PlatformUser> {
    this.users.set(user.id, user);
    return user;
  }

  async listAmmPools(): Promise<AmmPool[]> {
    return Array.from(this.ammPools.values());
  }

  async getAmmPool(id: string): Promise<AmmPool | undefined> {
    return this.ammPools.get(id);
  }

  async upsertAmmPool(pool: AmmPool): Promise<AmmPool> {
    this.ammPools.set(pool.id, pool);
    return pool;
  }

  async listBonds(): Promise<Bond[]> {
    return Array.from(this.bonds.values());
  }

  async getBond(id: string): Promise<Bond | undefined> {
    return this.bonds.get(id);
  }

  async upsertBond(bond: Bond): Promise<Bond> {
    this.bonds.set(bond.id, bond);
    return bond;
  }

  async findLockedBondByUser(userId: string): Promise<Bond | undefined> {
    return Array.from(this.bonds.values()).find(
      (bond) => bond.userId === userId && (bond.state === "locked" || bond.state === "partially_slashed")
    );
  }

  async listOffers(): Promise<Offer[]> {
    return Array.from(this.offers.values());
  }

  async getOffer(id: string): Promise<Offer | undefined> {
    return this.offers.get(id);
  }

  async upsertOffer(offer: Offer): Promise<Offer> {
    this.offers.set(offer.id, offer);
    return offer;
  }

  async listRedeems(): Promise<RedeemRequest[]> {
    return Array.from(this.redeems.values());
  }

  async getRedeem(id: string): Promise<RedeemRequest | undefined> {
    return this.redeems.get(id);
  }

  async upsertRedeem(redeem: RedeemRequest): Promise<RedeemRequest> {
    this.redeems.set(redeem.id, redeem);
    return redeem;
  }

  async listCredentials(userId?: string): Promise<CredentialRecord[]> {
    const items = Array.from(this.credentials.values());
    return userId ? items.filter((credential) => credential.userId === userId) : items;
  }

  async getCredential(id: string): Promise<CredentialRecord | undefined> {
    return this.credentials.get(id);
  }

  async upsertCredential(credential: CredentialRecord): Promise<CredentialRecord> {
    this.credentials.set(credential.id, credential);
    return credential;
  }

  async listOraclePrices(symbol?: string): Promise<OraclePricePoint[]> {
    const items = Array.from(this.oraclePrices.values());
    return symbol ? items.filter((price) => price.symbol === symbol) : items;
  }

  async createOraclePrice(price: OraclePricePoint): Promise<OraclePricePoint> {
    this.oraclePrices.set(price.id, price);
    return price;
  }

  async listProofs(offerId?: string): Promise<ProofArtifact[]> {
    const items = Array.from(this.proofs.values());
    return offerId ? items.filter((proof) => proof.offerId === offerId) : items;
  }

  async getProof(id: string): Promise<ProofArtifact | undefined> {
    return this.proofs.get(id);
  }

  async upsertProof(proof: ProofArtifact): Promise<ProofArtifact> {
    this.proofs.set(proof.id, proof);
    return proof;
  }

  async listDisputes(): Promise<DisputeCase[]> {
    return Array.from(this.disputes.values());
  }

  async getDispute(id: string): Promise<DisputeCase | undefined> {
    return this.disputes.get(id);
  }

  async upsertDispute(dispute: DisputeCase): Promise<DisputeCase> {
    this.disputes.set(dispute.id, dispute);
    return dispute;
  }

  async listProposals(): Promise<Proposal[]> {
    return Array.from(this.proposals.values());
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async upsertProposal(proposal: Proposal): Promise<Proposal> {
    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  async deleteProposal(id: string): Promise<void> {
    this.proposals.delete(id);
  }

  async createWalletChallenge(challenge: WalletChallengeRecord): Promise<WalletChallengeRecord> {
    this.walletChallenges.set(challenge.id, challenge);
    return challenge;
  }

  async getWalletChallenge(id: string): Promise<WalletChallengeRecord | undefined> {
    return this.walletChallenges.get(id);
  }

  async markWalletChallengeUsed(id: string, usedAt: string): Promise<WalletChallengeRecord> {
    const challenge = this.walletChallenges.get(id);

    if (!challenge) {
      throw new Error("Wallet challenge not found.");
    }

    const updatedChallenge: WalletChallengeRecord = {
      ...challenge,
      usedAt,
      updatedAt: usedAt
    };

    this.walletChallenges.set(id, updatedChallenge);
    return updatedChallenge;
  }

  async createAuditLog(entry: AuditLogEntry): Promise<AuditLogEntry> {
    this.auditLogs.set(entry.id, entry);
    return entry;
  }

  async listAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
    return Array.from(this.auditLogs.values()).slice(-limit).reverse();
  }

  async createFeeRecord(fee: FeeRecord): Promise<FeeRecord> {
    this.feeRecords.push(fee);
    return fee;
  }

  async listFeeRecords(entityType?: string, entityId?: string): Promise<FeeRecord[]> {
    return this.feeRecords.filter((fee) => {
      if (entityType && fee.entityType !== entityType) return false;
      if (entityId && fee.entityId !== entityId) return false;
      return true;
    });
  }

  private seed(): void {
    const producer = createUser({
      id: "usr_producer_1",
      name: "Cooperativa Serra Azul",
      email: "produtor@valyria.io",
      walletAddress: "rProducerValyria111111111111111111111",
      state: "producer_approved",
      roles: [],
      createdAt: SEEDED_AT
    });

    const buyer = createUser({
      id: "usr_buyer_1",
      name: "Mesa Agro Capital",
      email: "comprador@valyria.io",
      walletAddress: "rBuyerValyria111111111111111111111111",
      state: "kyc_approved",
      roles: [],
      createdAt: SEEDED_AT
    });

    const lockedBond = {
      ...createBond({
        id: "bond_1",
        userId: producer.id,
        amount: 15000,
        credentialIds: ["cred_kyc_001", "cred_producer_001"],
        state: "locked",
        createdAt: SEEDED_AT
      }),
      lockedAt: SEEDED_AT
    } satisfies Bond;

    const kycCredential = {
      ...createCredentialRecord({
        id: "cred_kyc_001",
        userId: producer.id,
        kind: "KYCApproved",
        issuerWallet: "rValyriaKycIssuer111111111111111111111",
        subjectWallet: producer.walletAddress,
        ledgerCredentialId: "ledger_cred_kyc_001",
        status: "accepted",
        createdAt: SEEDED_AT
      }),
      acceptedAt: SEEDED_AT
    } satisfies CredentialRecord;

    const producerCredential = {
      ...createCredentialRecord({
        id: "cred_producer_001",
        userId: producer.id,
        kind: "ProducerApproved",
        issuerWallet: "rValyriaKycIssuer111111111111111111111",
        subjectWallet: producer.walletAddress,
        ledgerCredentialId: "ledger_cred_producer_001",
        status: "accepted",
        createdAt: SEEDED_AT
      }),
      acceptedAt: SEEDED_AT
    } satisfies CredentialRecord;

    const listedOffer = createOffer({
      id: "offer_1",
      producerId: producer.id,
      quantity: 10000,
      unitPrice: 61.25,
      expiresAt: "2026-08-15T00:00:00.000Z",
      descriptor: {
        commodity: "MLH",
        region: "MT",
        year: 2026,
        cycle: "Q3",
        grade: "G1",
        lotUnit: "01",
        sequence: 1
      },
      status: "listed",
      createdAt: SEEDED_AT
    });

    const redeemableOffer = createOffer({
      id: "offer_2",
      producerId: producer.id,
      quantity: 4000,
      unitPrice: 74.5,
      expiresAt: "2026-11-30T00:00:00.000Z",
      descriptor: {
        commodity: "SOJ",
        region: "GO",
        year: 2026,
        cycle: "Q4",
        grade: "G1",
        lotUnit: "03",
        sequence: 3
      },
      status: "filled",
      currentHolderId: buyer.id,
      filledAt: SEEDED_AT,
      createdAt: SEEDED_AT
    });

    const seededRedeem = {
      ...createRedeemRequest({
        id: "redeem_1",
        offerId: redeemableOffer.id,
        holderId: buyer.id,
        settlementWallet: "rSettlementValyria1111111111111111111",
        createdAt: SEEDED_AT,
        trackingCode: "BR-SEED-001"
      }),
      state: "tracking_pending",
      settlementLedgerHash: "SEED_REDEEM_LEDGER_HASH",
      settlementLedgerSequence: 123456,
      settlementTransferredAt: SEEDED_AT
    } satisfies RedeemRequest;

    const seededDispute = createDisputeCase({
      id: "dispute_1",
      redeemId: seededRedeem.id,
      openedByUserId: buyer.id,
      reason: "Amostra com divergencia de qualidade no recebimento.",
      evidenceUri: "ipfs://bafybeidisputesample",
      bondId: lockedBond.id,
      slaDueAt: "2026-03-12T00:00:00.000Z",
      createdAt: SEEDED_AT
    });

    const proof = createProofArtifact({
      id: "proof_1",
      userId: producer.id,
      offerId: listedOffer.id,
      artifactType: "underwriting_report",
      commodity: "MLH",
      uri: "ipfs://bafybeivalyriaunderwritingproof",
      ipfsCid: "bafybeivalyriaunderwritingproof",
      metadata: {
        region: "MT",
        cycle: "Q3",
        score: 87
      },
      createdAt: SEEDED_AT
    });

    const oracle = createOraclePricePoint({
      id: "oracle_1",
      symbol: "MLH/BRL",
      source: "manual-seed",
      value: 61.25,
      publishedAt: SEEDED_AT,
      metadata: {
        feed: "seed"
      }
    });

    const mlhPool = createAmmPool({
      id: "pool_mlh_vex",
      pair: "MLH/VEX",
      baseAsset: "MLH",
      quoteAsset: "VEX",
      baseReserve: 180_000,
      quoteReserve: 11_200_000,
      feeBps: 30,
      createdAt: SEEDED_AT
    });

    const arzPool = createAmmPool({
      id: "pool_arz_vex",
      pair: "ARZ/VEX",
      baseAsset: "ARZ",
      quoteAsset: "VEX",
      baseReserve: 140_000,
      quoteReserve: 6_950_000,
      feeBps: 30,
      createdAt: SEEDED_AT
    });

    const fejPool = createAmmPool({
      id: "pool_fej_vex",
      pair: "FEJ/VEX",
      baseAsset: "FEJ",
      quoteAsset: "VEX",
      baseReserve: 95_000,
      quoteReserve: 4_020_000,
      feeBps: 30,
      createdAt: SEEDED_AT
    });

    const trgPool = createAmmPool({
      id: "pool_trg_vex",
      pair: "TRG/VEX",
      baseAsset: "TRG",
      quoteAsset: "VEX",
      baseReserve: 110_000,
      quoteReserve: 6_050_000,
      feeBps: 30,
      createdAt: SEEDED_AT
    });

    const acrPool = createAmmPool({
      id: "pool_acr_vex",
      pair: "ACR/VEX",
      baseAsset: "ACR",
      quoteAsset: "VEX",
      baseReserve: 200_000,
      quoteReserve: 7_750_000,
      feeBps: 30,
      createdAt: SEEDED_AT
    });

    const algPool = createAmmPool({
      id: "pool_alg_vex",
      pair: "ALG/VEX",
      baseAsset: "ALG",
      quoteAsset: "VEX",
      baseReserve: 45_000,
      quoteReserve: 4_170_000,
      feeBps: 30,
      createdAt: SEEDED_AT
    });

    const fejOffer = createOffer({
      id: "offer_5",
      producerId: producer.id,
      quantity: 3200,
      unitPrice: 42.3,
      expiresAt: "2026-10-01T00:00:00.000Z",
      descriptor: {
        commodity: "FEJ",
        region: "PR",
        year: 2026,
        cycle: "Q3",
        grade: "G1",
        lotUnit: "01",
        sequence: 12
      },
      status: "listed",
      createdAt: SEEDED_AT
    });

    const trgOffer = createOffer({
      id: "offer_6",
      producerId: producer.id,
      quantity: 5000,
      unitPrice: 55.0,
      expiresAt: "2026-12-15T00:00:00.000Z",
      descriptor: {
        commodity: "TRG",
        region: "RS",
        year: 2026,
        cycle: "Q4",
        grade: "G1",
        lotUnit: "02",
        sequence: 7
      },
      status: "listed",
      createdAt: SEEDED_AT
    });

    const acrOffer = createOffer({
      id: "offer_7",
      producerId: producer.id,
      quantity: 8000,
      unitPrice: 38.75,
      expiresAt: "2026-09-20T00:00:00.000Z",
      descriptor: {
        commodity: "ACR",
        region: "SP",
        year: 2026,
        cycle: "Q3",
        grade: "G2",
        lotUnit: "01",
        sequence: 4
      },
      status: "listed",
      createdAt: SEEDED_AT
    });

    const algOffer = createOffer({
      id: "offer_8",
      producerId: producer.id,
      quantity: 2500,
      unitPrice: 92.6,
      expiresAt: "2026-11-10T00:00:00.000Z",
      descriptor: {
        commodity: "ALG",
        region: "BA",
        year: 2026,
        cycle: "Q4",
        grade: "G1",
        lotUnit: "03",
        sequence: 2
      },
      status: "listed",
      createdAt: SEEDED_AT
    });

    const fejOracle = createOraclePricePoint({
      id: "oracle_fej",
      symbol: "FEJ/BRL",
      source: "manual-seed",
      value: 42.3,
      publishedAt: SEEDED_AT,
      metadata: { feed: "seed" }
    });

    const trgOracle = createOraclePricePoint({
      id: "oracle_trg",
      symbol: "TRG/BRL",
      source: "manual-seed",
      value: 55.0,
      publishedAt: SEEDED_AT,
      metadata: { feed: "seed" }
    });

    const acrOracle = createOraclePricePoint({
      id: "oracle_acr",
      symbol: "ACR/BRL",
      source: "manual-seed",
      value: 38.75,
      publishedAt: SEEDED_AT,
      metadata: { feed: "seed" }
    });

    const algOracle = createOraclePricePoint({
      id: "oracle_alg",
      symbol: "ALG/BRL",
      source: "manual-seed",
      value: 92.6,
      publishedAt: SEEDED_AT,
      metadata: { feed: "seed" }
    });

    void this.upsertUser(producer);
    void this.upsertUser(buyer);
    void this.upsertAmmPool(mlhPool);
    void this.upsertAmmPool(arzPool);
    void this.upsertAmmPool(fejPool);
    void this.upsertAmmPool(trgPool);
    void this.upsertAmmPool(acrPool);
    void this.upsertAmmPool(algPool);
    void this.upsertCredential(kycCredential);
    void this.upsertCredential(producerCredential);
    void this.upsertBond(lockedBond);
    void this.upsertOffer(listedOffer);
    void this.upsertOffer(redeemableOffer);
    void this.upsertOffer(fejOffer);
    void this.upsertOffer(trgOffer);
    void this.upsertOffer(acrOffer);
    void this.upsertOffer(algOffer);
    void this.upsertRedeem(seededRedeem);
    void this.upsertProof(proof);
    void this.createOraclePrice(oracle);
    void this.createOraclePrice(fejOracle);
    void this.createOraclePrice(trgOracle);
    void this.createOraclePrice(acrOracle);
    void this.createOraclePrice(algOracle);
    void this.upsertDispute(seededDispute);

    const proposalDraft = createProposal({
      id: "proposal_1",
      code: "VAL-001",
      title: "Aumentar colateral mínimo para 20.000 VEX",
      summary: "Proposta para elevar o colateral mínimo de bonds de 10.000 para 20.000 VEX.",
      authorId: producer.id,
      status: "draft",
      createdAt: SEEDED_AT
    });

    const proposalActive = createProposal({
      id: "proposal_2",
      code: "VAL-002",
      title: "Adicionar commodity café arábica (CAF)",
      summary: "Incluir café arábica como commodity listável na plataforma.",
      authorId: producer.id,
      status: "active",
      createdAt: SEEDED_AT
    });

    void this.upsertProposal(proposalDraft);
    void this.upsertProposal(proposalActive);
  }
}
