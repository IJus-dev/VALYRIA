import "dotenv/config";
import { prisma } from "@valyria/database";
import {
  createAmmPool,
  createBond,
  createCredentialRecord,
  createOffer,
  createOraclePricePoint,
  createProofArtifact,
  createRedeemRequest,
  createUser
} from "@valyria/domain";

async function main() {
  const seededAt = new Date("2026-03-07T00:00:00.000Z");
  const twoDaysAgo = new Date("2026-03-05T12:00:00.000Z");
  const oneDayAgo = new Date("2026-03-06T12:00:00.000Z");
  const fourHoursAgo = new Date("2026-03-06T20:00:00.000Z");
  const twoHoursAgo = new Date("2026-03-06T22:00:00.000Z");
  const oneHourAgo = new Date("2026-03-06T23:00:00.000Z");

  const producer = createUser({
    id: "usr_producer_1",
    name: "Cooperativa Serra Azul",
    email: "produtor@valyria.io",
    walletAddress: "rProducerValyria111111111111111111111",
    state: "producer_approved",
    createdAt: seededAt.toISOString()
  });

  const producerTwo = createUser({
    id: "usr_producer_2",
    name: "Fazenda Horizonte",
    email: "horizonte@valyria.io",
    walletAddress: "rHorizonteValyria1111111111111111111",
    state: "producer_approved",
    createdAt: oneDayAgo.toISOString()
  });

  const buyer = createUser({
    id: "usr_buyer_1",
    name: "Mesa Agro Capital",
    email: "comprador@valyria.io",
    walletAddress: "rBuyerValyria111111111111111111111111",
    state: "kyc_approved",
    createdAt: seededAt.toISOString()
  });

  const compliance = createUser({
    id: "usr_ops_1",
    name: "Valyria Ops Console",
    email: "ops@valyria.io",
    walletAddress: "rValyriaOps1111111111111111111111111",
    state: "wallet_linked",
    roles: ["admin", "compliance", "operations", "read_only"],
    createdAt: seededAt.toISOString()
  });

  for (const user of [producer, producerTwo, buyer, compliance]) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        walletAddress: user.walletAddress,
        state: user.state,
        roles: user.roles
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
  }

  const kycCredential = createCredentialRecord({
    id: "cred_kyc_001",
    userId: producer.id,
    kind: "KYCApproved",
    status: "accepted",
    issuerWallet: "rValyriaKycIssuer111111111111111111111",
    subjectWallet: producer.walletAddress,
    ledgerCredentialId: "ledger_cred_kyc_001",
    createdAt: seededAt.toISOString()
  });

  const producerCredential = createCredentialRecord({
    id: "cred_producer_001",
    userId: producer.id,
    kind: "ProducerApproved",
    status: "accepted",
    issuerWallet: "rValyriaKycIssuer111111111111111111111",
    subjectWallet: producer.walletAddress,
    ledgerCredentialId: "ledger_cred_producer_001",
    createdAt: seededAt.toISOString()
  });

  const producerTwoCredential = createCredentialRecord({
    id: "cred_producer_002",
    userId: producerTwo.id,
    kind: "ProducerApproved",
    status: "accepted",
    issuerWallet: "rValyriaKycIssuer111111111111111111111",
    subjectWallet: producerTwo.walletAddress,
    ledgerCredentialId: "ledger_cred_producer_002",
    createdAt: oneDayAgo.toISOString()
  });

  const producerTwoKyc = createCredentialRecord({
    id: "cred_kyc_002",
    userId: producerTwo.id,
    kind: "KYCApproved",
    status: "accepted",
    issuerWallet: "rValyriaKycIssuer111111111111111111111",
    subjectWallet: producerTwo.walletAddress,
    ledgerCredentialId: "ledger_cred_kyc_002",
    createdAt: oneDayAgo.toISOString()
  });

  for (const credential of [kycCredential, producerCredential]) {
    await prisma.credentialRecord.upsert({
      where: { id: credential.id },
      update: {
        status: credential.status,
        issuerWallet: credential.issuerWallet,
        subjectWallet: credential.subjectWallet,
        ledgerCredentialId: credential.ledgerCredentialId,
        acceptedAt: seededAt
      },
      create: {
        id: credential.id,
        userId: credential.userId,
        kind: credential.kind,
        status: credential.status,
        issuerWallet: credential.issuerWallet,
        subjectWallet: credential.subjectWallet,
        ledgerCredentialId: credential.ledgerCredentialId,
        createdAt: seededAt,
        updatedAt: seededAt,
        acceptedAt: seededAt
      }
    });
  }

  for (const credential of [producerTwoCredential, producerTwoKyc]) {
    await prisma.credentialRecord.upsert({
      where: { id: credential.id },
      update: {
        status: credential.status,
        issuerWallet: credential.issuerWallet,
        subjectWallet: credential.subjectWallet,
        ledgerCredentialId: credential.ledgerCredentialId,
        acceptedAt: new Date(oneDayAgo)
      },
      create: {
        id: credential.id,
        userId: credential.userId,
        kind: credential.kind,
        status: credential.status,
        issuerWallet: credential.issuerWallet,
        subjectWallet: credential.subjectWallet,
        ledgerCredentialId: credential.ledgerCredentialId,
        createdAt: new Date(credential.createdAt),
        updatedAt: new Date(credential.updatedAt),
        acceptedAt: new Date(oneDayAgo)
      }
    });
  }

  const bond = {
    ...createBond({
      id: "bond_1",
      userId: producer.id,
      amount: 15000,
      credentialIds: [kycCredential.id, producerCredential.id],
      state: "locked",
      createdAt: seededAt.toISOString()
    }),
    lockedAt: seededAt.toISOString()
  };

  await prisma.bond.upsert({
    where: { id: bond.id },
    update: {
      amount: bond.amount,
      state: bond.state,
      credentialIds: bond.credentialIds,
      lockedAt: seededAt
    },
    create: {
      id: bond.id,
      userId: bond.userId,
      amount: bond.amount,
      currency: bond.currency,
      credentialIds: bond.credentialIds,
      state: bond.state,
      createdAt: seededAt,
      updatedAt: seededAt,
      lockedAt: seededAt
    }
  });

  const bondTwo = {
    ...createBond({
      id: "bond_2",
      userId: producerTwo.id,
      amount: 8000,
      credentialIds: [producerTwoKyc.id, producerTwoCredential.id],
      state: "locked",
      createdAt: oneDayAgo.toISOString()
    }),
    lockedAt: oneDayAgo.toISOString()
  };

  await prisma.bond.upsert({
    where: { id: bondTwo.id },
    update: {
      amount: bondTwo.amount,
      state: bondTwo.state,
      credentialIds: bondTwo.credentialIds,
      lockedAt: oneDayAgo
    },
    create: {
      id: bondTwo.id,
      userId: bondTwo.userId,
      amount: bondTwo.amount,
      currency: bondTwo.currency,
      credentialIds: bondTwo.credentialIds,
      state: bondTwo.state,
      createdAt: oneDayAgo,
      updatedAt: oneDayAgo,
      lockedAt: oneDayAgo
    }
  });

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
    createdAt: seededAt.toISOString()
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
    createdAt: seededAt.toISOString()
  });

  const arrozOffer = createOffer({
    id: "offer_3",
    producerId: producerTwo.id,
    quantity: 6500,
    unitPrice: 48.9,
    expiresAt: "2026-09-30T00:00:00.000Z",
    descriptor: {
      commodity: "ARZ",
      region: "RS",
      year: 2026,
      cycle: "Q2",
      grade: "G1",
      lotUnit: "02",
      sequence: 9
    },
    status: "listed",
    createdAt: oneDayAgo.toISOString()
  });

  const cafeOffer = createOffer({
    id: "offer_4",
    producerId: producer.id,
    quantity: 1800,
    unitPrice: 129.4,
    expiresAt: "2026-10-18T00:00:00.000Z",
    descriptor: {
      commodity: "CAF",
      region: "MG",
      year: 2026,
      cycle: "Q4",
      grade: "G2",
      lotUnit: "01",
      sequence: 5
    },
    status: "partially_filled",
    createdAt: fourHoursAgo.toISOString()
  });

  for (const offer of [listedOffer, redeemableOffer]) {
    await prisma.offer.upsert({
      where: { id: offer.id },
      update: {
        status: offer.status,
        quantity: offer.quantity,
        unitPrice: offer.unitPrice,
        notional: offer.notional,
        expiresAt: new Date(offer.expiresAt),
        seriesAlias: offer.series.alias,
        seriesCurrencyHex: offer.series.currencyHex,
        seriesDescriptor: offer.series.descriptor
      },
      create: {
        id: offer.id,
        producerId: offer.producerId,
        quantity: offer.quantity,
        unitPrice: offer.unitPrice,
        notional: offer.notional,
        expiresAt: new Date(offer.expiresAt),
        createdAt: seededAt,
        updatedAt: seededAt,
        status: offer.status,
        seriesAlias: offer.series.alias,
        seriesCurrencyHex: offer.series.currencyHex,
        seriesDescriptor: offer.series.descriptor
      }
    });
  }

  const feijaoOffer = createOffer({
    id: "offer_5",
    producerId: producerTwo.id,
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
    createdAt: fourHoursAgo.toISOString()
  });

  const trigoOffer = createOffer({
    id: "offer_6",
    producerId: producerTwo.id,
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
    createdAt: twoHoursAgo.toISOString()
  });

  const acucarOffer = createOffer({
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
    createdAt: oneHourAgo.toISOString()
  });

  const algodaoOffer = createOffer({
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
    createdAt: oneHourAgo.toISOString()
  });

  for (const offer of [arrozOffer, cafeOffer, feijaoOffer, trigoOffer, acucarOffer, algodaoOffer]) {
    await prisma.offer.upsert({
      where: { id: offer.id },
      update: {
        status: offer.status,
        quantity: offer.quantity,
        unitPrice: offer.unitPrice,
        notional: offer.notional,
        expiresAt: new Date(offer.expiresAt),
        seriesAlias: offer.series.alias,
        seriesCurrencyHex: offer.series.currencyHex,
        seriesDescriptor: offer.series.descriptor
      },
      create: {
        id: offer.id,
        producerId: offer.producerId,
        quantity: offer.quantity,
        unitPrice: offer.unitPrice,
        notional: offer.notional,
        expiresAt: new Date(offer.expiresAt),
        createdAt: new Date(offer.createdAt),
        updatedAt: new Date(offer.updatedAt),
        status: offer.status,
        seriesAlias: offer.series.alias,
        seriesCurrencyHex: offer.series.currencyHex,
        seriesDescriptor: offer.series.descriptor
      }
    });
  }

  const redeem = {
    ...createRedeemRequest({
      id: "redeem_1",
      offerId: redeemableOffer.id,
      holderId: buyer.id,
      settlementWallet: "rValyriaSettlement11111111111111111111",
      createdAt: seededAt.toISOString()
    }),
    state: "tracking_pending" as const
  };

  await prisma.redeemRequest.upsert({
    where: { id: redeem.id },
    update: {
      state: redeem.state,
      requestedAt: new Date(redeem.requestedAt)
    },
    create: {
      id: redeem.id,
      offerId: redeem.offerId,
      holderId: redeem.holderId,
      state: redeem.state,
      requestedAt: new Date(redeem.requestedAt),
      responseWindowDays: redeem.responseWindowDays,
      settlementWallet: redeem.settlementWallet
    }
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
    createdAt: seededAt.toISOString()
  });

  await prisma.proofArtifact.upsert({
    where: { id: proof.id },
    update: {
      uri: proof.uri,
      ipfsCid: proof.ipfsCid,
      metadata: proof.metadata
    },
    create: {
      id: proof.id,
      userId: proof.userId,
      offerId: proof.offerId,
      artifactType: proof.artifactType,
      commodity: proof.commodity,
      uri: proof.uri,
      ipfsCid: proof.ipfsCid,
      metadata: proof.metadata,
      createdAt: seededAt
    }
  });

  const proofs = [
    createProofArtifact({
      id: "proof_2",
      userId: producerTwo.id,
      offerId: arrozOffer.id,
      artifactType: "farm_document",
      commodity: "ARZ",
      uri: "ipfs://bafybeivalyriafarmdoc002",
      ipfsCid: "bafybeivalyriafarmdoc002",
      metadata: {
        hectares: 92,
        region: "RS"
      },
      createdAt: oneDayAgo.toISOString()
    }),
    createProofArtifact({
      id: "proof_3",
      userId: producer.id,
      offerId: cafeOffer.id,
      artifactType: "geo_photo",
      commodity: "CAF",
      uri: "ipfs://bafybeivalyriageophoto003",
      ipfsCid: "bafybeivalyriageophoto003",
      metadata: {
        altitude: 1010,
        region: "MG"
      },
      createdAt: twoHoursAgo.toISOString()
    }),
    createProofArtifact({
      id: "proof_4",
      userId: producer.id,
      offerId: redeemableOffer.id,
      artifactType: "delivery_receipt",
      commodity: "SOJ",
      uri: "ipfs://bafybeivalyriadelivery004",
      ipfsCid: "bafybeivalyriadelivery004",
      metadata: {
        warehouse: "Sorriso Hub",
        tracking: "VAL-SOJ-7781"
      },
      createdAt: oneHourAgo.toISOString()
    })
  ];

  for (const item of proofs) {
    await prisma.proofArtifact.upsert({
      where: { id: item.id },
      update: {
        uri: item.uri,
        ipfsCid: item.ipfsCid,
        metadata: item.metadata
      },
      create: {
        id: item.id,
        userId: item.userId,
        offerId: item.offerId,
        artifactType: item.artifactType,
        commodity: item.commodity,
        uri: item.uri,
        ipfsCid: item.ipfsCid,
        metadata: item.metadata,
        createdAt: new Date(item.createdAt)
      }
    });
  }

  const oracleSnapshots = [
    createOraclePricePoint({
      id: "oracle_1",
      symbol: "MLH/BRL",
      source: "manual-seed",
      value: 58.8,
      publishedAt: twoDaysAgo.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_2",
      symbol: "MLH/BRL",
      source: "manual-seed",
      value: 59.7,
      publishedAt: oneDayAgo.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_3",
      symbol: "MLH/BRL",
      source: "manual-seed",
      value: 60.2,
      publishedAt: fourHoursAgo.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_4",
      symbol: "MLH/BRL",
      source: "manual-seed",
      value: 60.9,
      publishedAt: twoHoursAgo.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_5",
      symbol: "MLH/BRL",
      source: "manual-seed",
      value: 61.1,
      publishedAt: oneHourAgo.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_6",
      symbol: "MLH/BRL",
      source: "manual-seed",
      value: 61.25,
      publishedAt: seededAt.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_7",
      symbol: "ARZ/BRL",
      source: "manual-seed",
      value: 48.9,
      publishedAt: seededAt.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_8",
      symbol: "CAF/BRL",
      source: "manual-seed",
      value: 129.4,
      publishedAt: seededAt.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_9",
      symbol: "SOJ/BRL",
      source: "manual-seed",
      value: 74.5,
      publishedAt: seededAt.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_10",
      symbol: "FEJ/BRL",
      source: "manual-seed",
      value: 42.3,
      publishedAt: seededAt.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_11",
      symbol: "TRG/BRL",
      source: "manual-seed",
      value: 55.0,
      publishedAt: seededAt.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_12",
      symbol: "ACR/BRL",
      source: "manual-seed",
      value: 38.75,
      publishedAt: seededAt.toISOString(),
      metadata: { feed: "seed" }
    }),
    createOraclePricePoint({
      id: "oracle_13",
      symbol: "ALG/BRL",
      source: "manual-seed",
      value: 92.6,
      publishedAt: seededAt.toISOString(),
      metadata: { feed: "seed" }
    })
  ];

  for (const oracle of oracleSnapshots) {
    await prisma.oraclePrice.upsert({
      where: { id: oracle.id },
      update: {
        value: oracle.value,
        metadata: oracle.metadata,
        publishedAt: new Date(oracle.publishedAt)
      },
      create: {
        id: oracle.id,
        symbol: oracle.symbol,
        source: oracle.source,
        value: oracle.value,
        metadata: oracle.metadata,
        publishedAt: new Date(oracle.publishedAt)
      }
    });
  }

  await prisma.disputeCase.upsert({
    where: { id: "dispute_1" },
    update: {
      tier: "tier_1",
      state: "opened",
      reason: "Amostra com divergencia de qualidade no recebimento.",
      evidenceUri: "ipfs://bafybeivalyriadisputeevidence001",
      updatedAt: seededAt
    },
    create: {
      id: "dispute_1",
      redeemId: redeem.id,
      openedByUserId: buyer.id,
      tier: "tier_1",
      state: "opened",
      reason: "Amostra com divergencia de qualidade no recebimento.",
      evidenceUri: "ipfs://bafybeivalyriadisputeevidence001",
      createdAt: seededAt,
      updatedAt: seededAt
    }
  });

  const auditLogs = [
    {
      id: "audit_1",
      actorUserId: compliance.id,
      action: "user.created",
      entityType: "user",
      entityId: producer.id,
      payload: { email: producer.email },
      createdAt: seededAt
    },
    {
      id: "audit_2",
      actorUserId: compliance.id,
      action: "credential.accepted",
      entityType: "credential",
      entityId: producerCredential.id,
      payload: { newUserState: "producer_approved" },
      createdAt: seededAt
    },
    {
      id: "audit_3",
      actorUserId: compliance.id,
      action: "bond.locked",
      entityType: "bond",
      entityId: bond.id,
      payload: { amount: bond.amount },
      createdAt: seededAt
    },
    {
      id: "audit_4",
      actorUserId: producer.id,
      action: "offer.created",
      entityType: "offer",
      entityId: listedOffer.id,
      payload: { series: listedOffer.series.alias },
      createdAt: seededAt
    },
    {
      id: "audit_5",
      actorUserId: buyer.id,
      action: "redeem.requested",
      entityType: "redeem",
      entityId: redeem.id,
      payload: { offerId: redeem.offerId },
      createdAt: seededAt
    },
    {
      id: "audit_6",
      actorUserId: buyer.id,
      action: "dispute.opened",
      entityType: "dispute",
      entityId: "dispute_1",
      payload: { redeemId: redeem.id },
      createdAt: seededAt
    },
    {
      id: "audit_7",
      actorUserId: compliance.id,
      action: "oracle.published",
      entityType: "oracle",
      entityId: "oracle_6",
      payload: { symbol: "MLH/BRL", value: 61.25 },
      createdAt: seededAt
    }
  ];

  const ammPools = [
    createAmmPool({
      id: "pool_mlh_vex",
      pair: "MLH/VEX",
      baseAsset: "MLH",
      quoteAsset: "VEX",
      baseReserve: 180_000,
      quoteReserve: 11_200_000,
      feeBps: 30,
      createdAt: seededAt.toISOString()
    }),
    createAmmPool({
      id: "pool_arz_vex",
      pair: "ARZ/VEX",
      baseAsset: "ARZ",
      quoteAsset: "VEX",
      baseReserve: 140_000,
      quoteReserve: 6_950_000,
      feeBps: 30,
      createdAt: seededAt.toISOString()
    }),
    createAmmPool({
      id: "pool_caf_vex",
      pair: "CAF/VEX",
      baseAsset: "CAF",
      quoteAsset: "VEX",
      baseReserve: 25_000,
      quoteReserve: 3_180_000,
      feeBps: 30,
      createdAt: seededAt.toISOString()
    }),
    createAmmPool({
      id: "pool_fej_vex",
      pair: "FEJ/VEX",
      baseAsset: "FEJ",
      quoteAsset: "VEX",
      baseReserve: 95_000,
      quoteReserve: 4_020_000,
      feeBps: 30,
      createdAt: seededAt.toISOString()
    }),
    createAmmPool({
      id: "pool_trg_vex",
      pair: "TRG/VEX",
      baseAsset: "TRG",
      quoteAsset: "VEX",
      baseReserve: 110_000,
      quoteReserve: 6_050_000,
      feeBps: 30,
      createdAt: seededAt.toISOString()
    }),
    createAmmPool({
      id: "pool_acr_vex",
      pair: "ACR/VEX",
      baseAsset: "ACR",
      quoteAsset: "VEX",
      baseReserve: 200_000,
      quoteReserve: 7_750_000,
      feeBps: 30,
      createdAt: seededAt.toISOString()
    }),
    createAmmPool({
      id: "pool_alg_vex",
      pair: "ALG/VEX",
      baseAsset: "ALG",
      quoteAsset: "VEX",
      baseReserve: 45_000,
      quoteReserve: 4_170_000,
      feeBps: 30,
      createdAt: seededAt.toISOString()
    })
  ];

  for (const pool of ammPools) {
    await prisma.ammPool.upsert({
      where: { id: pool.id },
      update: {
        pair: pool.pair,
        baseAsset: pool.baseAsset,
        quoteAsset: pool.quoteAsset,
        baseReserve: pool.baseReserve,
        quoteReserve: pool.quoteReserve,
        feeBps: pool.feeBps,
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
        createdAt: new Date(pool.createdAt),
        updatedAt: new Date(pool.updatedAt)
      }
    });
  }

  for (const log of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      update: {
        actorUserId: log.actorUserId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        payload: log.payload,
        createdAt: log.createdAt
      },
      create: {
        id: log.id,
        actorUserId: log.actorUserId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        payload: log.payload,
        createdAt: log.createdAt
      }
    });
  }

  // --- Governance Proposals ---
  await prisma.proposal.upsert({
    where: { code: "VAL-001" },
    update: {},
    create: {
      code: "VAL-001",
      title: "Expandir lane AMM para ARZ/BRL",
      summary: "Ofertas de arroz já justificam um pool dedicado no AMM.",
      status: "active",
      authorId: producer.id,
    },
  });

  await prisma.proposal.upsert({
    where: { code: "VAL-002" },
    update: {},
    create: {
      code: "VAL-002",
      title: "Revisar SLA de disputas com prova digital forte",
      summary: "Disputas abertas pedem afinamento operacional de janela de aceite.",
      status: "review",
      authorId: buyer.id,
    },
  });

  await prisma.proposal.upsert({
    where: { code: "VAL-003" },
    update: {},
    create: {
      code: "VAL-003",
      title: "Adicionar segundo publisher de oracle",
      summary: "Snapshots publicados já sustentam a trilha para multi-oracle.",
      status: "draft",
      authorId: compliance.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
