import { prisma } from "@valyria/database";
import {
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
import type { Prisma } from "@valyria/database";
import type { AuditLogEntry, PlatformRepository, WalletChallengeRecord } from "../../modules/platform-repository";

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toPlatformUser(user: PrismaUser): PlatformUser {
  return {
    id: user.id,
    ...(user.name ? { name: user.name } : {}),
    email: user.email ?? undefined,
    ...(user.walletAddress ? { walletAddress: user.walletAddress } : {}),
    state: user.state,
    roles: user.roles as PlatformUser["roles"],
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

function toAmmPool(pool: PrismaAmmPool): AmmPool {
  return {
    id: pool.id,
    pair: pool.pair,
    baseAsset: pool.baseAsset,
    quoteAsset: pool.quoteAsset,
    baseReserve: pool.baseReserve,
    quoteReserve: pool.quoteReserve,
    feeBps: pool.feeBps,
    ...(pool.ammAccountId ? { ammAccountId: pool.ammAccountId } : {}),
    ...(pool.lpTokenCurrency ? { lpTokenCurrency: pool.lpTokenCurrency } : {}),
    ...(pool.lpTokenIssuer ? { lpTokenIssuer: pool.lpTokenIssuer } : {}),
    ...(pool.ammLedgerHash ? { ammLedgerHash: pool.ammLedgerHash } : {}),
    isNative: pool.isNative,
    createdAt: pool.createdAt.toISOString(),
    updatedAt: pool.updatedAt.toISOString()
  };
}

function toBond(bond: PrismaBond): Bond {
  return {
    id: bond.id,
    userId: bond.userId,
    amount: bond.amount,
    currency: bond.currency,
    credentialIds: [...bond.credentialIds],
    state: bond.state,
    slashedAmount: bond.slashedAmount,
    ...(bond.ledgerHash ? { ledgerHash: bond.ledgerHash } : {}),
    ...(typeof bond.ledgerSequence === "number" ? { ledgerSequence: bond.ledgerSequence } : {}),
    ...(typeof bond.escrowSequence === "number" ? { escrowSequence: bond.escrowSequence } : {}),
    ...(bond.escrowCondition ? { escrowCondition: bond.escrowCondition } : {}),
    ...(bond.escrowFinishAfter ? { escrowFinishAfter: bond.escrowFinishAfter.toISOString() } : {}),
    ...(bond.escrowLedgerHash ? { escrowLedgerHash: bond.escrowLedgerHash } : {}),
    createdAt: bond.createdAt.toISOString(),
    updatedAt: bond.updatedAt.toISOString(),
    ...(bond.lockedAt ? { lockedAt: bond.lockedAt.toISOString() } : {}),
    ...(bond.frozenAt ? { frozenAt: bond.frozenAt.toISOString() } : {})
  };
}

function toOffer(offer: PrismaOffer): Offer {
  const descriptor = offer.seriesDescriptor as unknown as Offer["series"]["descriptor"];

  return {
    id: offer.id,
    producerId: offer.producerId,
    quantity: offer.quantity,
    unitPrice: offer.unitPrice,
    notional: offer.notional,
    expiresAt: offer.expiresAt.toISOString(),
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
    status: offer.status,
    executionLane: offer.executionLane,
    series: {
      alias: offer.seriesAlias,
      currencyHex: offer.seriesCurrencyHex,
      descriptor
    },
    ...(offer.sellerWallet ? { sellerWallet: offer.sellerWallet } : {}),
    ...(offer.seriesIssuer ? { seriesIssuer: offer.seriesIssuer } : {}),
    ...(offer.quoteCurrency ? { quoteCurrency: offer.quoteCurrency } : {}),
    ...(offer.quoteIssuer ? { quoteIssuer: offer.quoteIssuer } : {}),
    ...(offer.ledgerHash ? { ledgerHash: offer.ledgerHash } : {}),
    ...(typeof offer.ledgerSequence === "number" ? { ledgerSequence: offer.ledgerSequence } : {}),
    ...(typeof offer.ledgerOfferSequence === "number"
      ? { ledgerOfferSequence: offer.ledgerOfferSequence }
      : {}),
    ...(offer.currentHolderId ? { currentHolderId: offer.currentHolderId } : {}),
    ...(offer.fillLedgerHash ? { fillLedgerHash: offer.fillLedgerHash } : {}),
    ...(typeof offer.fillLedgerSequence === "number"
      ? { fillLedgerSequence: offer.fillLedgerSequence }
      : {}),
    ...(offer.filledAt ? { filledAt: offer.filledAt.toISOString() } : {}),
    ...(typeof offer.filledQuantity === "number" ? { filledQuantity: offer.filledQuantity } : {})
  };
}

function toRedeem(redeem: PrismaRedeemRequest): RedeemRequest {
  return {
    id: redeem.id,
    offerId: redeem.offerId,
    holderId: redeem.holderId,
    state: redeem.state,
    requestedAt: redeem.requestedAt.toISOString(),
    responseWindowDays: redeem.responseWindowDays,
    settlementWallet: redeem.settlementWallet,
    ...(redeem.settlementLedgerHash ? { settlementLedgerHash: redeem.settlementLedgerHash } : {}),
    ...(typeof redeem.settlementLedgerSequence === "number"
      ? { settlementLedgerSequence: redeem.settlementLedgerSequence }
      : {}),
    ...(redeem.settlementTransferredAt
      ? { settlementTransferredAt: redeem.settlementTransferredAt.toISOString() }
      : {}),
    ...(typeof redeem.escrowSequence === "number" ? { escrowSequence: redeem.escrowSequence } : {}),
    ...(redeem.escrowFinishAfter ? { escrowFinishAfter: redeem.escrowFinishAfter.toISOString() } : {}),
    ...(redeem.escrowLedgerHash ? { escrowLedgerHash: redeem.escrowLedgerHash } : {}),
    ...(redeem.trackingCode ? { trackingCode: redeem.trackingCode } : {}),
    ...(redeem.shippedAt ? { shippedAt: redeem.shippedAt.toISOString() } : {}),
    ...(redeem.deliveredAt ? { deliveredAt: redeem.deliveredAt.toISOString() } : {}),
    ...(redeem.acceptedAt ? { acceptedAt: redeem.acceptedAt.toISOString() } : {}),
    ...(redeem.closedAt ? { closedAt: redeem.closedAt.toISOString() } : {})
  };
}

function toCredential(record: PrismaCredentialRecord): CredentialRecord {
  return {
    id: record.id,
    userId: record.userId,
    kind: record.kind,
    status: record.status,
    ...(record.issuerWallet ? { issuerWallet: record.issuerWallet } : {}),
    ...(record.subjectWallet ? { subjectWallet: record.subjectWallet } : {}),
    ...(record.ledgerCredentialId ? { ledgerCredentialId: record.ledgerCredentialId } : {}),
    ...(record.expiresAt ? { expiresAt: record.expiresAt.toISOString() } : {}),
    ...(record.acceptedAt ? { acceptedAt: record.acceptedAt.toISOString() } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function toProof(proof: PrismaProofArtifact): ProofArtifact {
  return {
    id: proof.id,
    ...(proof.userId ? { userId: proof.userId } : {}),
    ...(proof.offerId ? { offerId: proof.offerId } : {}),
    artifactType: proof.artifactType,
    commodity: proof.commodity,
    uri: proof.uri,
    ...(proof.ipfsCid ? { ipfsCid: proof.ipfsCid } : {}),
    ...(proof.manifestHash ? { manifestHash: proof.manifestHash } : {}),
    ...(proof.nftTokenId ? { nftTokenId: proof.nftTokenId } : {}),
    ...(proof.nftIssuerWallet ? { nftIssuerWallet: proof.nftIssuerWallet } : {}),
    ...(proof.nftUri ? { nftUri: proof.nftUri } : {}),
    ...(proof.nftMintHash ? { nftMintHash: proof.nftMintHash } : {}),
    ...(typeof proof.nftMintLedgerSequence === "number"
      ? { nftMintLedgerSequence: proof.nftMintLedgerSequence }
      : {}),
    ...(proof.nftMintedAt ? { nftMintedAt: proof.nftMintedAt.toISOString() } : {}),
    ...(proof.metadata ? { metadata: proof.metadata as Record<string, string | number | boolean> } : {}),
    createdAt: proof.createdAt.toISOString()
  };
}

function toOraclePrice(price: PrismaOraclePrice): OraclePricePoint {
  return {
    id: price.id,
    symbol: price.symbol,
    source: price.source,
    value: price.value,
    publishedAt: price.publishedAt.toISOString(),
    ...(price.metadata ? { metadata: price.metadata as Record<string, string | number | boolean> } : {})
  };
}

function toDispute(dispute: PrismaDisputeCase): DisputeCase {
  return {
    id: dispute.id,
    redeemId: dispute.redeemId,
    openedByUserId: dispute.openedByUserId,
    tier: dispute.tier,
    state: dispute.state,
    reason: dispute.reason,
    ...(dispute.evidenceUri ? { evidenceUri: dispute.evidenceUri } : {}),
    ...(dispute.bondId ? { bondId: dispute.bondId } : {}),
    ...(dispute.bondDecision ? { bondDecision: dispute.bondDecision } : {}),
    ...(dispute.slaDueAt ? { slaDueAt: dispute.slaDueAt.toISOString() } : {}),
    ...(dispute.resolvedAt ? { resolvedAt: dispute.resolvedAt.toISOString() } : {}),
    ...(dispute.resolutionSummary ? { resolutionSummary: dispute.resolutionSummary } : {}),
    createdAt: dispute.createdAt.toISOString(),
    updatedAt: dispute.updatedAt.toISOString()
  };
}

function toWalletChallenge(record: PrismaWalletChallenge): WalletChallengeRecord {
  return {
    id: record.id,
    userId: record.userId,
    walletAddress: record.walletAddress,
    nonce: record.nonce,
    message: record.message,
    expiresAt: record.expiresAt.toISOString(),
    ...(record.usedAt ? { usedAt: record.usedAt.toISOString() } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function toAuditLog(log: PrismaAuditLog): AuditLogEntry {
  return {
    id: log.id,
    ...(log.actorUserId ? { actorUserId: log.actorUserId } : {}),
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    ...(log.payload ? { payload: log.payload as Record<string, unknown> } : {}),
    createdAt: log.createdAt.toISOString()
  };
}

type PrismaUser = Awaited<ReturnType<typeof prisma.user.findFirstOrThrow>>;
type PrismaAmmPool = Awaited<ReturnType<typeof prisma.ammPool.findFirstOrThrow>>;
type PrismaBond = Awaited<ReturnType<typeof prisma.bond.findFirstOrThrow>>;
type PrismaOffer = Awaited<ReturnType<typeof prisma.offer.findFirstOrThrow>>;
type PrismaRedeemRequest = Awaited<ReturnType<typeof prisma.redeemRequest.findFirstOrThrow>>;
type PrismaCredentialRecord = Awaited<ReturnType<typeof prisma.credentialRecord.findFirstOrThrow>>;
type PrismaProofArtifact = Awaited<ReturnType<typeof prisma.proofArtifact.findFirstOrThrow>>;
type PrismaOraclePrice = Awaited<ReturnType<typeof prisma.oraclePrice.findFirstOrThrow>>;
type PrismaDisputeCase = Awaited<ReturnType<typeof prisma.disputeCase.findFirstOrThrow>>;
type PrismaWalletChallenge = Awaited<ReturnType<typeof prisma.walletChallenge.findFirstOrThrow>>;
type PrismaAuditLog = Awaited<ReturnType<typeof prisma.auditLog.findFirstOrThrow>>;
type PrismaFeeRecord = Awaited<ReturnType<typeof prisma.feeRecord.findFirstOrThrow>>;
type PrismaProposal = Awaited<ReturnType<typeof prisma.proposal.findFirstOrThrow>>;

function toProposal(proposal: PrismaProposal): Proposal {
  return {
    id: proposal.id,
    code: proposal.code,
    title: proposal.title,
    summary: proposal.summary,
    status: proposal.status as Proposal["status"],
    authorId: proposal.authorId,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString()
  };
}

function toFeeRecord(record: PrismaFeeRecord): FeeRecord {
  return {
    id: record.id,
    feeType: record.feeType as FeeRecord["feeType"],
    entityType: record.entityType,
    entityId: record.entityId,
    baseAmount: record.baseAmount,
    feeRate: record.feeRate,
    feeAmount: record.feeAmount,
    currency: record.currency,
    createdAt: record.createdAt.toISOString()
  };
}

export class PrismaPlatformRepository implements PlatformRepository {
  async listUsers(): Promise<PlatformUser[]> {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return users.map(toPlatformUser);
  }

  async getUser(id: string): Promise<PlatformUser | undefined> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toPlatformUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<PlatformUser | undefined> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? toPlatformUser(user) : undefined;
  }

  async upsertUser(user: PlatformUser): Promise<PlatformUser> {
    const savedUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        state: user.state,
        roles: user.roles,
        updatedAt: new Date(user.updatedAt)
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        state: user.state,
        roles: user.roles,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }
    });

    return toPlatformUser(savedUser);
  }

  async listAmmPools(): Promise<AmmPool[]> {
    const pools = await prisma.ammPool.findMany({ orderBy: { pair: "asc" } });
    return pools.map(toAmmPool);
  }

  async getAmmPool(id: string): Promise<AmmPool | undefined> {
    const pool = await prisma.ammPool.findUnique({ where: { id } });
    return pool ? toAmmPool(pool) : undefined;
  }

  async upsertAmmPool(pool: AmmPool): Promise<AmmPool> {
    const savedPool = await prisma.ammPool.upsert({
      where: { id: pool.id },
      update: {
        pair: pool.pair,
        baseAsset: pool.baseAsset,
        quoteAsset: pool.quoteAsset,
        baseReserve: pool.baseReserve,
        quoteReserve: pool.quoteReserve,
        feeBps: pool.feeBps,
        ammAccountId: pool.ammAccountId ?? null,
        lpTokenCurrency: pool.lpTokenCurrency ?? null,
        lpTokenIssuer: pool.lpTokenIssuer ?? null,
        ammLedgerHash: pool.ammLedgerHash ?? null,
        isNative: pool.isNative,
        updatedAt: new Date(pool.updatedAt)
      },
      create: {
        id: pool.id,
        pair: pool.pair,
        baseAsset: pool.baseAsset,
        quoteAsset: pool.quoteAsset,
        baseReserve: pool.baseReserve,
        quoteReserve: pool.quoteReserve,
        feeBps: pool.feeBps,
        ammAccountId: pool.ammAccountId ?? null,
        lpTokenCurrency: pool.lpTokenCurrency ?? null,
        lpTokenIssuer: pool.lpTokenIssuer ?? null,
        ammLedgerHash: pool.ammLedgerHash ?? null,
        isNative: pool.isNative,
        createdAt: new Date(pool.createdAt),
        updatedAt: new Date(pool.updatedAt)
      }
    });

    return toAmmPool(savedPool);
  }

  async listBonds(): Promise<Bond[]> {
    const bonds = await prisma.bond.findMany({ orderBy: { createdAt: "asc" } });
    return bonds.map(toBond);
  }

  async getBond(id: string): Promise<Bond | undefined> {
    const bond = await prisma.bond.findUnique({ where: { id } });
    return bond ? toBond(bond) : undefined;
  }

  async upsertBond(bond: Bond): Promise<Bond> {
    const savedBond = await prisma.bond.upsert({
      where: { id: bond.id },
      update: {
        amount: bond.amount,
        currency: bond.currency,
        credentialIds: bond.credentialIds,
        state: bond.state,
        slashedAmount: bond.slashedAmount,
        ledgerHash: bond.ledgerHash,
        ledgerSequence: bond.ledgerSequence,
        escrowSequence: bond.escrowSequence ?? null,
        escrowCondition: bond.escrowCondition ?? null,
        escrowFinishAfter: bond.escrowFinishAfter ? new Date(bond.escrowFinishAfter) : null,
        escrowLedgerHash: bond.escrowLedgerHash ?? null,
        updatedAt: new Date(bond.updatedAt),
        lockedAt: bond.lockedAt ? new Date(bond.lockedAt) : null,
        frozenAt: bond.frozenAt ? new Date(bond.frozenAt) : null
      },
      create: {
        id: bond.id,
        userId: bond.userId,
        amount: bond.amount,
        currency: bond.currency,
        credentialIds: bond.credentialIds,
        state: bond.state,
        slashedAmount: bond.slashedAmount,
        ledgerHash: bond.ledgerHash,
        ledgerSequence: bond.ledgerSequence,
        escrowSequence: bond.escrowSequence ?? null,
        escrowCondition: bond.escrowCondition ?? null,
        escrowFinishAfter: bond.escrowFinishAfter ? new Date(bond.escrowFinishAfter) : null,
        escrowLedgerHash: bond.escrowLedgerHash ?? null,
        createdAt: new Date(bond.createdAt),
        updatedAt: new Date(bond.updatedAt),
        lockedAt: bond.lockedAt ? new Date(bond.lockedAt) : null,
        frozenAt: bond.frozenAt ? new Date(bond.frozenAt) : null
      }
    });

    return toBond(savedBond);
  }

  async findLockedBondByUser(userId: string): Promise<Bond | undefined> {
    const bond = await prisma.bond.findFirst({
      where: {
        userId,
        state: { in: ["locked", "partially_slashed"] }
      },
      orderBy: { createdAt: "desc" }
    });

    return bond ? toBond(bond) : undefined;
  }

  async listOffers(): Promise<Offer[]> {
    const offers = await prisma.offer.findMany({ orderBy: { createdAt: "asc" } });
    return offers.map(toOffer);
  }

  async getOffer(id: string): Promise<Offer | undefined> {
    const offer = await prisma.offer.findUnique({ where: { id } });
    return offer ? toOffer(offer) : undefined;
  }

  async upsertOffer(offer: Offer): Promise<Offer> {
    const savedOffer = await prisma.offer.upsert({
      where: { id: offer.id },
      update: {
        quantity: offer.quantity,
        unitPrice: offer.unitPrice,
        notional: offer.notional,
        expiresAt: new Date(offer.expiresAt),
        updatedAt: new Date(offer.updatedAt),
        status: offer.status,
        executionLane: offer.executionLane,
        seriesAlias: offer.series.alias,
        seriesCurrencyHex: offer.series.currencyHex,
        seriesDescriptor: offer.series.descriptor as unknown as Prisma.InputJsonValue,
        sellerWallet: offer.sellerWallet,
        seriesIssuer: offer.seriesIssuer,
        quoteCurrency: offer.quoteCurrency,
        quoteIssuer: offer.quoteIssuer,
        ledgerHash: offer.ledgerHash,
        ledgerSequence: offer.ledgerSequence,
        ledgerOfferSequence: offer.ledgerOfferSequence,
        currentHolderId: offer.currentHolderId,
        fillLedgerHash: offer.fillLedgerHash,
        fillLedgerSequence: offer.fillLedgerSequence,
        filledAt: offer.filledAt ? new Date(offer.filledAt) : null,
        filledQuantity: offer.filledQuantity ?? null
      },
      create: {
        id: offer.id,
        producerId: offer.producerId,
        currentHolderId: offer.currentHolderId,
        quantity: offer.quantity,
        unitPrice: offer.unitPrice,
        notional: offer.notional,
        expiresAt: new Date(offer.expiresAt),
        createdAt: new Date(offer.createdAt),
        updatedAt: new Date(offer.updatedAt),
        status: offer.status,
        executionLane: offer.executionLane,
        seriesAlias: offer.series.alias,
        seriesCurrencyHex: offer.series.currencyHex,
        seriesDescriptor: offer.series.descriptor as unknown as Prisma.InputJsonValue,
        sellerWallet: offer.sellerWallet,
        seriesIssuer: offer.seriesIssuer,
        quoteCurrency: offer.quoteCurrency,
        quoteIssuer: offer.quoteIssuer,
        ledgerHash: offer.ledgerHash,
        ledgerSequence: offer.ledgerSequence,
        ledgerOfferSequence: offer.ledgerOfferSequence,
        fillLedgerHash: offer.fillLedgerHash,
        fillLedgerSequence: offer.fillLedgerSequence,
        filledAt: offer.filledAt ? new Date(offer.filledAt) : null,
        filledQuantity: offer.filledQuantity ?? null
      }
    });

    return toOffer(savedOffer);
  }

  async listRedeems(): Promise<RedeemRequest[]> {
    const redeems = await prisma.redeemRequest.findMany({ orderBy: { requestedAt: "asc" } });
    return redeems.map(toRedeem);
  }

  async getRedeem(id: string): Promise<RedeemRequest | undefined> {
    const redeem = await prisma.redeemRequest.findUnique({ where: { id } });
    return redeem ? toRedeem(redeem) : undefined;
  }

  async upsertRedeem(redeem: RedeemRequest): Promise<RedeemRequest> {
    const savedRedeem = await prisma.redeemRequest.upsert({
      where: { id: redeem.id },
      update: {
        state: redeem.state,
        requestedAt: new Date(redeem.requestedAt),
        responseWindowDays: redeem.responseWindowDays,
        settlementWallet: redeem.settlementWallet,
        settlementLedgerHash: redeem.settlementLedgerHash,
        settlementLedgerSequence: redeem.settlementLedgerSequence,
        settlementTransferredAt: redeem.settlementTransferredAt ? new Date(redeem.settlementTransferredAt) : null,
        escrowSequence: redeem.escrowSequence ?? null,
        escrowFinishAfter: redeem.escrowFinishAfter ? new Date(redeem.escrowFinishAfter) : null,
        escrowLedgerHash: redeem.escrowLedgerHash ?? null,
        trackingCode: redeem.trackingCode,
        shippedAt: redeem.shippedAt ? new Date(redeem.shippedAt) : null,
        deliveredAt: redeem.deliveredAt ? new Date(redeem.deliveredAt) : null,
        acceptedAt: redeem.acceptedAt ? new Date(redeem.acceptedAt) : null,
        closedAt: redeem.closedAt ? new Date(redeem.closedAt) : null
      },
      create: {
        id: redeem.id,
        offerId: redeem.offerId,
        holderId: redeem.holderId,
        state: redeem.state,
        requestedAt: new Date(redeem.requestedAt),
        responseWindowDays: redeem.responseWindowDays,
        settlementWallet: redeem.settlementWallet,
        settlementLedgerHash: redeem.settlementLedgerHash,
        settlementLedgerSequence: redeem.settlementLedgerSequence,
        settlementTransferredAt: redeem.settlementTransferredAt ? new Date(redeem.settlementTransferredAt) : null,
        escrowSequence: redeem.escrowSequence ?? null,
        escrowFinishAfter: redeem.escrowFinishAfter ? new Date(redeem.escrowFinishAfter) : null,
        escrowLedgerHash: redeem.escrowLedgerHash ?? null,
        trackingCode: redeem.trackingCode,
        shippedAt: redeem.shippedAt ? new Date(redeem.shippedAt) : null,
        deliveredAt: redeem.deliveredAt ? new Date(redeem.deliveredAt) : null,
        acceptedAt: redeem.acceptedAt ? new Date(redeem.acceptedAt) : null,
        closedAt: redeem.closedAt ? new Date(redeem.closedAt) : null
      }
    });

    return toRedeem(savedRedeem);
  }

  async listCredentials(userId?: string): Promise<CredentialRecord[]> {
    const credentials = await prisma.credentialRecord.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: "asc" }
    });

    return credentials.map(toCredential);
  }

  async getCredential(id: string): Promise<CredentialRecord | undefined> {
    const credential = await prisma.credentialRecord.findUnique({ where: { id } });
    return credential ? toCredential(credential) : undefined;
  }

  async upsertCredential(credential: CredentialRecord): Promise<CredentialRecord> {
    const savedCredential = await prisma.credentialRecord.upsert({
      where: { id: credential.id },
      update: {
        kind: credential.kind,
        status: credential.status,
        issuerWallet: credential.issuerWallet,
        subjectWallet: credential.subjectWallet,
        ledgerCredentialId: credential.ledgerCredentialId,
        expiresAt: credential.expiresAt ? new Date(credential.expiresAt) : null,
        acceptedAt: credential.acceptedAt ? new Date(credential.acceptedAt) : null,
        updatedAt: new Date(credential.updatedAt)
      },
      create: {
        id: credential.id,
        userId: credential.userId,
        kind: credential.kind,
        status: credential.status,
        issuerWallet: credential.issuerWallet,
        subjectWallet: credential.subjectWallet,
        ledgerCredentialId: credential.ledgerCredentialId,
        expiresAt: credential.expiresAt ? new Date(credential.expiresAt) : null,
        acceptedAt: credential.acceptedAt ? new Date(credential.acceptedAt) : null,
        createdAt: new Date(credential.createdAt),
        updatedAt: new Date(credential.updatedAt)
      }
    });

    return toCredential(savedCredential);
  }

  async listOraclePrices(symbol?: string): Promise<OraclePricePoint[]> {
    const prices = await prisma.oraclePrice.findMany({
      where: symbol ? { symbol } : undefined,
      orderBy: { publishedAt: "desc" }
    });

    return prices.map(toOraclePrice);
  }

  async createOraclePrice(price: OraclePricePoint): Promise<OraclePricePoint> {
    const savedPrice = await prisma.oraclePrice.upsert({
      where: { id: price.id },
      update: {
        symbol: price.symbol,
        source: price.source,
        value: price.value,
        metadata: price.metadata as Prisma.InputJsonValue | undefined,
        publishedAt: new Date(price.publishedAt)
      },
      create: {
        id: price.id,
        symbol: price.symbol,
        source: price.source,
        value: price.value,
        metadata: price.metadata as Prisma.InputJsonValue | undefined,
        publishedAt: new Date(price.publishedAt)
      }
    });

    return toOraclePrice(savedPrice);
  }

  async listProofs(offerId?: string): Promise<ProofArtifact[]> {
    const proofs = await prisma.proofArtifact.findMany({
      where: offerId ? { offerId } : undefined,
      orderBy: { createdAt: "desc" }
    });

    return proofs.map(toProof);
  }

  async getProof(id: string): Promise<ProofArtifact | undefined> {
    const proof = await prisma.proofArtifact.findUnique({
      where: { id }
    });

    return proof ? toProof(proof) : undefined;
  }

  async upsertProof(proof: ProofArtifact): Promise<ProofArtifact> {
    const savedProof = await prisma.proofArtifact.upsert({
      where: { id: proof.id },
      update: {
        artifactType: proof.artifactType,
        commodity: proof.commodity,
        uri: proof.uri,
        ipfsCid: proof.ipfsCid,
        manifestHash: proof.manifestHash,
        nftTokenId: proof.nftTokenId,
        nftIssuerWallet: proof.nftIssuerWallet,
        nftUri: proof.nftUri,
        nftMintHash: proof.nftMintHash,
        nftMintLedgerSequence: proof.nftMintLedgerSequence,
        nftMintedAt: proof.nftMintedAt ? new Date(proof.nftMintedAt) : null,
        metadata: proof.metadata as Prisma.InputJsonValue | undefined
      },
      create: {
        id: proof.id,
        userId: proof.userId,
        offerId: proof.offerId,
        artifactType: proof.artifactType,
        commodity: proof.commodity,
        uri: proof.uri,
        ipfsCid: proof.ipfsCid,
        manifestHash: proof.manifestHash,
        nftTokenId: proof.nftTokenId,
        nftIssuerWallet: proof.nftIssuerWallet,
        nftUri: proof.nftUri,
        nftMintHash: proof.nftMintHash,
        nftMintLedgerSequence: proof.nftMintLedgerSequence,
        nftMintedAt: proof.nftMintedAt ? new Date(proof.nftMintedAt) : null,
        metadata: proof.metadata as Prisma.InputJsonValue | undefined,
        createdAt: new Date(proof.createdAt)
      }
    });

    return toProof(savedProof);
  }

  async listDisputes(): Promise<DisputeCase[]> {
    const disputes = await prisma.disputeCase.findMany({ orderBy: { createdAt: "desc" } });
    return disputes.map(toDispute);
  }

  async getDispute(id: string): Promise<DisputeCase | undefined> {
    const dispute = await prisma.disputeCase.findUnique({ where: { id } });
    return dispute ? toDispute(dispute) : undefined;
  }

  async upsertDispute(dispute: DisputeCase): Promise<DisputeCase> {
    const savedDispute = await prisma.disputeCase.upsert({
      where: { id: dispute.id },
      update: {
        tier: dispute.tier,
        state: dispute.state,
        reason: dispute.reason,
        evidenceUri: dispute.evidenceUri,
        bondId: dispute.bondId,
        bondDecision: dispute.bondDecision,
        slaDueAt: dispute.slaDueAt ? new Date(dispute.slaDueAt) : null,
        resolvedAt: dispute.resolvedAt ? new Date(dispute.resolvedAt) : null,
        resolutionSummary: dispute.resolutionSummary,
        updatedAt: new Date(dispute.updatedAt)
      },
      create: {
        id: dispute.id,
        redeemId: dispute.redeemId,
        openedByUserId: dispute.openedByUserId,
        tier: dispute.tier,
        state: dispute.state,
        reason: dispute.reason,
        evidenceUri: dispute.evidenceUri,
        bondId: dispute.bondId,
        bondDecision: dispute.bondDecision,
        slaDueAt: dispute.slaDueAt ? new Date(dispute.slaDueAt) : null,
        resolvedAt: dispute.resolvedAt ? new Date(dispute.resolvedAt) : null,
        resolutionSummary: dispute.resolutionSummary,
        createdAt: new Date(dispute.createdAt),
        updatedAt: new Date(dispute.updatedAt)
      }
    });

    return toDispute(savedDispute);
  }

  async listProposals(): Promise<Proposal[]> {
    const proposals = await prisma.proposal.findMany({ orderBy: { createdAt: "desc" } });
    return proposals.map(toProposal);
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    const proposal = await prisma.proposal.findUnique({ where: { id } });
    return proposal ? toProposal(proposal) : undefined;
  }

  async upsertProposal(proposal: Proposal): Promise<Proposal> {
    const saved = await prisma.proposal.upsert({
      where: { id: proposal.id },
      update: {
        code: proposal.code,
        title: proposal.title,
        summary: proposal.summary,
        status: proposal.status,
        updatedAt: new Date(proposal.updatedAt)
      },
      create: {
        id: proposal.id,
        code: proposal.code,
        title: proposal.title,
        summary: proposal.summary,
        status: proposal.status,
        authorId: proposal.authorId,
        createdAt: new Date(proposal.createdAt),
        updatedAt: new Date(proposal.updatedAt)
      }
    });

    return toProposal(saved);
  }

  async deleteProposal(id: string): Promise<void> {
    await prisma.proposal.delete({ where: { id } });
  }

  async createWalletChallenge(challenge: WalletChallengeRecord): Promise<WalletChallengeRecord> {
    const savedChallenge = await prisma.walletChallenge.create({
      data: {
        id: challenge.id,
        userId: challenge.userId,
        walletAddress: challenge.walletAddress,
        nonce: challenge.nonce,
        message: challenge.message,
        expiresAt: new Date(challenge.expiresAt),
        usedAt: challenge.usedAt ? new Date(challenge.usedAt) : null,
        createdAt: new Date(challenge.createdAt),
        updatedAt: new Date(challenge.updatedAt)
      }
    });

    return toWalletChallenge(savedChallenge);
  }

  async getWalletChallenge(id: string): Promise<WalletChallengeRecord | undefined> {
    const challenge = await prisma.walletChallenge.findUnique({ where: { id } });
    return challenge ? toWalletChallenge(challenge) : undefined;
  }

  async markWalletChallengeUsed(id: string, usedAt: string): Promise<WalletChallengeRecord> {
    const challenge = await prisma.walletChallenge.update({
      where: { id },
      data: {
        usedAt: new Date(usedAt),
        updatedAt: new Date(usedAt)
      }
    });

    return toWalletChallenge(challenge);
  }

  async createAuditLog(entry: AuditLogEntry): Promise<AuditLogEntry> {
    const savedLog = await prisma.auditLog.create({
      data: {
        id: entry.id,
        actorUserId: entry.actorUserId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        payload: entry.payload as Prisma.InputJsonValue | undefined,
        createdAt: new Date(toIsoString(entry.createdAt))
      }
    });

    return toAuditLog(savedLog);
  }

  async listAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return logs.map(toAuditLog);
  }

  async createFeeRecord(fee: FeeRecord): Promise<FeeRecord> {
    const savedFee = await prisma.feeRecord.create({
      data: {
        id: fee.id,
        feeType: fee.feeType,
        entityType: fee.entityType,
        entityId: fee.entityId,
        baseAmount: fee.baseAmount,
        feeRate: fee.feeRate,
        feeAmount: fee.feeAmount,
        currency: fee.currency,
        createdAt: new Date(fee.createdAt)
      }
    });

    return toFeeRecord(savedFee);
  }

  async listFeeRecords(entityType?: string, entityId?: string): Promise<FeeRecord[]> {
    const where: Record<string, string> = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    const records = await prisma.feeRecord.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" }
    });

    return records.map(toFeeRecord);
  }
}
