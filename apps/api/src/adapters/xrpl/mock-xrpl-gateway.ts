import {
  buildAmmCreateIntent,
  buildAmmDepositIntent,
  buildAmmWithdrawIntent,
  buildBondDepositIntent,
  buildBondEscrowCreateIntent,
  buildBondEscrowFinishIntent,
  buildBondEscrowCancelIntent,
  buildCredentialCreateIntent,
  buildOracleSetIntent,
  buildProofNftIntent,
  buildRedeemEscrowCreateIntent,
  buildRedeemEscrowFinishIntent,
  buildRedeemEscrowCancelIntent,
  buildSeriesBuyIntent,
  buildSeriesOfferIntent,
  buildSeriesRedeemIntent,
  type BondDepositIntent,
  type CredentialCreateIntent,
  type OracleSetIntent
} from "@valyria/xrpl";
import type {
  AccountTopology,
  AmmCreateSubmission,
  AmmDepositSubmission,
  AmmInfoResult,
  AmmWithdrawSubmission,
  BondDepositSubmission,
  BondEscrowCreateSubmission,
  BondEscrowFinishSubmission,
  BondEscrowCancelSubmission,
  CredentialAcceptSubmission,
  CredentialCreateSubmission,
  OracleAggregateResult,
  OracleSetSubmission,
  ProofNftMintSubmission,
  RedeemEscrowCreateSubmission,
  RedeemEscrowFinishSubmission,
  RedeemEscrowCancelSubmission,
  SeriesBuySubmission,
  SeriesRedeemSubmission,
  SeriesOfferSubmission,
  XrplGateway,
  XrplNetworkStatus
} from "./xrpl-gateway";

export class MockXrplGateway implements XrplGateway {
  constructor(
    private readonly topology: AccountTopology = {
      coldIssuer: "rValyriaColdIssuer11111111111111111111",
      treasury: "rValyriaTreasury1111111111111111111111",
      bondVault: "rValyriaBondVault111111111111111111111",
      settlement: "rValyriaSettlement11111111111111111111",
      hotApi: "rValyriaHotApi111111111111111111111111",
      oraclePublisher: "rValyriaOracle1111111111111111111111",
      kycIssuer: "rValyriaKycIssuer111111111111111111111"
    }
  ) {}

  getAccountTopology(): AccountTopology {
    return this.topology;
  }

  async getNetworkStatus(): Promise<XrplNetworkStatus> {
    return {
      mode: "mock",
      networkId: 1,
      connected: false
    };
  }

  previewBondDeposit(input: {
    amount: number;
    credentialIds: string[];
    issuer?: string;
  }): BondDepositIntent {
    return buildBondDepositIntent({
      destination: this.topology.bondVault,
      amount: {
        currency: "VEX",
        value: input.amount.toFixed(2),
        ...(input.issuer ? { issuer: input.issuer } : {})
      },
      credentialIds: input.credentialIds
    });
  }

  previewCredentialCreate(input: {
    subjectWallet: string;
    credentialType: string;
    expiresAt?: string;
  }): CredentialCreateIntent {
    return buildCredentialCreateIntent({
      subjectWallet: input.subjectWallet,
      issuerWallet: this.topology.kycIssuer,
      credentialType: input.credentialType,
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {})
    });
  }

  previewOracleSet(input: {
    symbol: string;
    value: number;
    scale?: number;
    source: string;
  }): OracleSetIntent {
    return buildOracleSetIntent({
      publisherWallet: this.topology.oraclePublisher,
      symbol: input.symbol,
      value: input.value,
      source: input.source,
      ...(typeof input.scale === "number" ? { scale: input.scale } : {})
    });
  }

  async submitBondDeposit(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    amount: number;
    credentialLedgerIds: string[];
    issuer?: string;
  }): Promise<BondDepositSubmission> {
    return {
      intent: this.previewBondDeposit({
        amount: input.amount,
        credentialIds: input.credentialLedgerIds,
        ...(input.issuer ? { issuer: input.issuer } : {})
      }),
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.sourceWalletAddress,
        transactionType: "Payment"
      }
    };
  }

  // MockGateway não simula escrow on-chain — retorna receipt com dados plausíveis
  async submitBondEscrowCreate(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    destinationAddress: string;
    amount: string;
    finishAfter: string;
    condition?: string;
    credentialIds: string[];
  }): Promise<BondEscrowCreateSubmission> {
    return {
      intent: buildBondEscrowCreateIntent({
        source: input.sourceWalletAddress,
        destination: input.destinationAddress,
        amount: input.amount,
        finishAfter: input.finishAfter,
        ...(input.condition ? { condition: input.condition } : {}),
        credentialIds: input.credentialIds
      }),
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.sourceWalletAddress,
        transactionType: "EscrowCreate"
      },
      escrowSequence: 99999
    };
  }

  async submitBondEscrowFinish(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
    condition?: string;
    fulfillment?: string;
  }): Promise<BondEscrowFinishSubmission> {
    return {
      intent: buildBondEscrowFinishIntent({
        owner: input.owner,
        offerSequence: input.offerSequence,
        ...(input.condition ? { condition: input.condition } : {}),
        ...(input.fulfillment ? { fulfillment: input.fulfillment } : {})
      }),
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.sourceWalletAddress,
        transactionType: "EscrowFinish"
      }
    };
  }

  async submitBondEscrowCancel(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
  }): Promise<BondEscrowCancelSubmission> {
    return {
      intent: buildBondEscrowCancelIntent({
        owner: input.owner,
        offerSequence: input.offerSequence
      }),
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.sourceWalletAddress,
        transactionType: "EscrowCancel"
      }
    };
  }

  // MockGateway não simula escrow de redeem on-chain — retorna receipt com dados plausíveis
  async submitRedeemEscrowCreate(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    destinationAddress: string;
    amount: string;
    finishAfter: string;
    deliver: { currency: string; issuer: string; value: string };
  }): Promise<RedeemEscrowCreateSubmission> {
    return {
      intent: buildRedeemEscrowCreateIntent({
        source: input.sourceWalletAddress,
        destination: input.destinationAddress,
        amount: input.amount,
        finishAfter: input.finishAfter,
        deliver: input.deliver
      }),
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.sourceWalletAddress,
        transactionType: "EscrowCreate"
      },
      escrowSequence: 99998
    };
  }

  async submitRedeemEscrowFinish(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
  }): Promise<RedeemEscrowFinishSubmission> {
    return {
      intent: buildRedeemEscrowFinishIntent({
        owner: input.owner,
        offerSequence: input.offerSequence
      }),
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.sourceWalletAddress,
        transactionType: "EscrowFinish"
      }
    };
  }

  async submitRedeemEscrowCancel(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
  }): Promise<RedeemEscrowCancelSubmission> {
    return {
      intent: buildRedeemEscrowCancelIntent({
        owner: input.owner,
        offerSequence: input.offerSequence
      }),
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.sourceWalletAddress,
        transactionType: "EscrowCancel"
      }
    };
  }

  async submitCredentialCreate(input: {
    subjectWallet: string;
    credentialType: string;
    expiresAt?: string;
  }): Promise<CredentialCreateSubmission> {
    return {
      intent: this.previewCredentialCreate(input),
      receipt: {
        mode: "mock",
        submitted: false,
        account: this.topology.kycIssuer,
        transactionType: "CredentialCreate"
      }
    };
  }

  async submitCredentialAccept(input: {
    subjectWalletAddress: string;
    subjectWalletSeed?: string;
    issuerWallet: string;
    credentialType: string;
  }): Promise<CredentialAcceptSubmission> {
    return {
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.subjectWalletAddress,
        transactionType: "CredentialAccept"
      }
    };
  }

  async submitOracleSet(input: {
    symbol: string;
    value: number;
    scale?: number;
    source: string;
  }): Promise<OracleSetSubmission> {
    return {
      intent: this.previewOracleSet(input),
      receipt: {
        mode: "mock",
        submitted: false,
        account: this.topology.oraclePublisher,
        transactionType: "OracleSet"
      },
      oracleDocumentId: 0
    };
  }

  async submitSeriesOffer(input: {
    sellerWalletAddress: string;
    sellerWalletSeed?: string;
    seriesCurrencyHex: string;
    seriesIssuer?: string;
    quantity: number;
    unitPrice: number;
    expiresAt?: string;
  }): Promise<SeriesOfferSubmission> {
    return {
      intent: buildSeriesOfferIntent({
        sellerWallet: input.sellerWalletAddress,
        sell: {
          currency: input.seriesCurrencyHex,
          issuer: input.seriesIssuer ?? this.topology.coldIssuer,
          value: input.quantity.toFixed(2)
        },
        receive: {
          currency: "VEX",
          issuer: this.topology.coldIssuer,
          value: (input.quantity * input.unitPrice).toFixed(2)
        },
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {})
      }),
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.sellerWalletAddress,
        transactionType: "OfferCreate"
      }
    };
  }

  async submitSeriesBuy(input: {
    buyerWalletAddress: string;
    buyerWalletSeed?: string;
    seriesCurrencyHex: string;
    seriesIssuer?: string;
    quantity: number;
    unitPrice: number;
  }): Promise<SeriesBuySubmission> {
    return {
      intent: buildSeriesBuyIntent({
        buyerWallet: input.buyerWalletAddress,
        receive: {
          currency: input.seriesCurrencyHex,
          issuer: input.seriesIssuer ?? this.topology.coldIssuer,
          value: input.quantity.toFixed(2)
        },
        pay: {
          currency: "VEX",
          issuer: this.topology.coldIssuer,
          value: (input.quantity * input.unitPrice).toFixed(2)
        }
      }),
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.buyerWalletAddress,
        transactionType: "OfferCreate"
      },
      filledQuantity: input.quantity,
      requestedQuantity: input.quantity
    };
  }

  async submitSeriesRedeem(input: {
    holderWalletAddress: string;
    holderWalletSeed?: string;
    destinationWalletAddress: string;
    destinationWalletSeed?: string;
    seriesCurrencyHex: string;
    seriesIssuer?: string;
    quantity: number;
  }): Promise<SeriesRedeemSubmission> {
    return {
      intent: buildSeriesRedeemIntent({
        holderWallet: input.holderWalletAddress,
        destinationWallet: input.destinationWalletAddress,
        deliver: {
          currency: input.seriesCurrencyHex,
          issuer: input.seriesIssuer ?? this.topology.coldIssuer,
          value: input.quantity.toFixed(2)
        }
      }),
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.holderWalletAddress,
        transactionType: "Payment"
      }
    };
  }

  async submitProofNftMint(input: {
    ownerWalletAddress: string;
    ownerWalletSeed?: string;
    uri: string;
    taxon: number;
  }): Promise<ProofNftMintSubmission> {
    return {
      intent: buildProofNftIntent({
        ownerWallet: input.ownerWalletAddress,
        uri: input.uri,
        taxon: input.taxon
      }),
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.ownerWalletAddress,
        transactionType: "NFTokenMint"
      }
    };
  }

  async submitAmmCreate(input: {
    creatorWalletAddress: string;
    creatorWalletSeed?: string;
    amount1: { currency: string; issuer: string; value: string };
    amount2: { currency: string; issuer: string; value: string };
    tradingFee: number;
  }): Promise<AmmCreateSubmission> {
    const intent = buildAmmCreateIntent({
      creatorWallet: input.creatorWalletAddress,
      amount1: input.amount1,
      amount2: input.amount2,
      tradingFee: input.tradingFee
    });

    return {
      intent,
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.creatorWalletAddress,
        transactionType: "AMMCreate"
      },
      ammAccountId: "rMockAmmAccount1111111111111111111111"
    };
  }

  async submitAmmDeposit(input: {
    depositorWalletAddress: string;
    depositorWalletSeed?: string;
    asset1: { currency: string; issuer: string };
    asset2: { currency: string; issuer: string };
    amount?: { currency: string; issuer: string; value: string };
    amount2?: { currency: string; issuer: string; value: string };
    lpTokenOut?: { currency: string; issuer: string; value: string };
  }): Promise<AmmDepositSubmission> {
    const intent = buildAmmDepositIntent({
      depositorWallet: input.depositorWalletAddress,
      asset1: input.asset1,
      asset2: input.asset2,
      ...(input.amount ? { amount: input.amount } : {}),
      ...(input.amount2 ? { amount2: input.amount2 } : {}),
      ...(input.lpTokenOut ? { lpTokenOut: input.lpTokenOut } : {})
    });

    return {
      intent,
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.depositorWalletAddress,
        transactionType: "AMMDeposit"
      }
    };
  }

  async submitAmmWithdraw(input: {
    withdrawerWalletAddress: string;
    withdrawerWalletSeed?: string;
    asset1: { currency: string; issuer: string };
    asset2: { currency: string; issuer: string };
    lpTokenIn?: { currency: string; issuer: string; value: string };
    amount?: { currency: string; issuer: string; value: string };
  }): Promise<AmmWithdrawSubmission> {
    const intent = buildAmmWithdrawIntent({
      withdrawerWallet: input.withdrawerWalletAddress,
      asset1: input.asset1,
      asset2: input.asset2,
      ...(input.lpTokenIn ? { lpTokenIn: input.lpTokenIn } : {}),
      ...(input.amount ? { amount: input.amount } : {})
    });

    return {
      intent,
      receipt: {
        mode: "mock",
        submitted: false,
        account: input.withdrawerWalletAddress,
        transactionType: "AMMWithdraw"
      }
    };
  }

  async getAmmInfo(input: {
    asset1: { currency: string; issuer: string };
    asset2: { currency: string; issuer: string };
  }): Promise<AmmInfoResult> {
    // Dados estáticos plausíveis pra dev local
    return {
      ammAccountId: "rMockAmmAccount1111111111111111111111",
      amount1: {
        currency: input.asset1.currency,
        issuer: input.asset1.issuer,
        value: "180000.0"
      },
      amount2: {
        currency: input.asset2.currency,
        issuer: input.asset2.issuer,
        value: "11200000.0"
      },
      lpToken: {
        currency: "03A20924B3E48D2575F5B03B042B3E58BE55CF42",
        issuer: "rMockAmmAccount1111111111111111111111",
        value: "1419784.68"
      },
      tradingFee: 30
    };
  }

  async getAggregatePrice(input: {
    baseAsset: string;
    quoteAsset: string;
    oracles: Array<{ account: string; oracleDocumentId: number }>;
    trim?: number;
  }): Promise<OracleAggregateResult> {
    return {
      median: 61.25,
      entireSet: input.oracles.map((o) => ({
        oracleId: o.account,
        price: 61.25
      })),
      time: Math.floor(Date.now() / 1000)
    };
  }
}
