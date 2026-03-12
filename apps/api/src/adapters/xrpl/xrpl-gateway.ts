import type {
  AmmCreateIntent,
  AmmDepositIntent,
  AmmWithdrawIntent,
  BondDepositIntent,
  BondEscrowCreateIntent,
  BondEscrowFinishIntent,
  BondEscrowCancelIntent,
  CredentialCreateIntent,
  OracleSetIntent,
  ProofNftIntent,
  RedeemEscrowCreateIntent,
  RedeemEscrowFinishIntent,
  RedeemEscrowCancelIntent,
  SeriesBuyIntent,
  SeriesOfferIntent,
  SeriesRedeemIntent
} from "@valyria/xrpl";

export interface AccountTopology {
  coldIssuer: string;
  treasury: string;
  bondVault: string;
  settlement: string;
  hotApi: string;
  oraclePublisher: string;
  kycIssuer: string;
}

export interface XrplNetworkStatus {
  mode: "mock" | "real";
  networkId: number;
  url?: string;
  connected: boolean;
  ledgerVersion?: number;
}

export interface XrplSubmissionReceipt {
  mode: "mock" | "real";
  submitted: boolean;
  account: string;
  transactionType:
    | "Payment"
    | "CredentialCreate"
    | "CredentialAccept"
    | "OracleSet"
    | "OfferCreate"
    | "TrustSet"
    | "NFTokenMint"
    | "EscrowCreate"
    | "EscrowFinish"
    | "EscrowCancel"
    | "AMMCreate"
    | "AMMDeposit"
    | "AMMWithdraw";
  hash?: string;
  ledgerIndex?: number;
  transactionResult?: string;
}

export interface BondDepositSubmission {
  intent: BondDepositIntent;
  receipt: XrplSubmissionReceipt;
}

export interface BondEscrowCreateSubmission {
  intent: BondEscrowCreateIntent;
  receipt: XrplSubmissionReceipt;
  escrowSequence?: number;
}

export interface BondEscrowFinishSubmission {
  intent: BondEscrowFinishIntent;
  receipt: XrplSubmissionReceipt;
}

export interface BondEscrowCancelSubmission {
  intent: BondEscrowCancelIntent;
  receipt: XrplSubmissionReceipt;
}

export interface RedeemEscrowCreateSubmission {
  intent: RedeemEscrowCreateIntent;
  receipt: XrplSubmissionReceipt;
  escrowSequence?: number;
}

export interface RedeemEscrowFinishSubmission {
  intent: RedeemEscrowFinishIntent;
  receipt: XrplSubmissionReceipt;
}

export interface RedeemEscrowCancelSubmission {
  intent: RedeemEscrowCancelIntent;
  receipt: XrplSubmissionReceipt;
}

export interface CredentialCreateSubmission {
  intent: CredentialCreateIntent;
  receipt: XrplSubmissionReceipt;
  credentialLedgerIndex?: string;
}

export interface CredentialAcceptSubmission {
  receipt: XrplSubmissionReceipt;
  credentialLedgerIndex?: string;
}

export interface OracleSetSubmission {
  intent: OracleSetIntent;
  receipt: XrplSubmissionReceipt;
  oracleDocumentId: number;
}

export interface SeriesOfferSubmission {
  intent: SeriesOfferIntent;
  inventoryReceipt?: XrplSubmissionReceipt;
  receipt: XrplSubmissionReceipt;
  offerSequence?: number;
}

export interface SeriesBuySubmission {
  intent: SeriesBuyIntent;
  receipt: XrplSubmissionReceipt;
  filledQuantity?: number;
  requestedQuantity?: number;
}

export interface SeriesRedeemSubmission {
  intent: SeriesRedeemIntent;
  receipt: XrplSubmissionReceipt;
}

export interface ProofNftMintSubmission {
  intent: ProofNftIntent;
  receipt: XrplSubmissionReceipt;
  nftTokenId?: string;
}

export interface AmmCreateSubmission {
  intent: AmmCreateIntent;
  receipt: XrplSubmissionReceipt;
  ammAccountId?: string;
}

export interface AmmDepositSubmission {
  intent: AmmDepositIntent;
  receipt: XrplSubmissionReceipt;
}

export interface AmmWithdrawSubmission {
  intent: AmmWithdrawIntent;
  receipt: XrplSubmissionReceipt;
}

export interface AmmInfoResult {
  ammAccountId: string;
  amount1: { currency: string; issuer: string; value: string };
  amount2: { currency: string; issuer: string; value: string };
  lpToken: { currency: string; issuer: string; value: string };
  tradingFee: number;
  ledgerHash?: string;
}

export interface OracleAggregateResult {
  median: number;
  mean?: number;
  entireSet: Array<{ oracleId: string; price: number }>;
  trimmedSet?: Array<{ oracleId: string; price: number }>;
  time: number;
}

export interface XrplGateway {
  getAccountTopology(): AccountTopology;
  getNetworkStatus(): Promise<XrplNetworkStatus>;
  previewBondDeposit(input: {
    amount: number;
    credentialIds: string[];
    issuer?: string;
  }): BondDepositIntent;
  previewCredentialCreate(input: {
    subjectWallet: string;
    credentialType: string;
    expiresAt?: string;
  }): CredentialCreateIntent;
  previewOracleSet(input: {
    symbol: string;
    value: number;
    scale?: number;
    source: string;
  }): OracleSetIntent;
  submitBondDeposit(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    amount: number;
    credentialLedgerIds: string[];
    issuer?: string;
  }): Promise<BondDepositSubmission>;
  submitBondEscrowCreate(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    destinationAddress: string;
    amount: string;
    finishAfter: string;
    condition?: string;
    credentialIds: string[];
  }): Promise<BondEscrowCreateSubmission>;
  submitBondEscrowFinish(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
    condition?: string;
    fulfillment?: string;
  }): Promise<BondEscrowFinishSubmission>;
  submitBondEscrowCancel(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
  }): Promise<BondEscrowCancelSubmission>;
  submitRedeemEscrowCreate(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    destinationAddress: string;
    amount: string;
    finishAfter: string;
    deliver: { currency: string; issuer: string; value: string };
  }): Promise<RedeemEscrowCreateSubmission>;
  submitRedeemEscrowFinish(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
  }): Promise<RedeemEscrowFinishSubmission>;
  submitRedeemEscrowCancel(input: {
    sourceWalletAddress: string;
    sourceWalletSeed?: string;
    owner: string;
    offerSequence: number;
  }): Promise<RedeemEscrowCancelSubmission>;
  submitCredentialCreate(input: {
    subjectWallet: string;
    credentialType: string;
    expiresAt?: string;
  }): Promise<CredentialCreateSubmission>;
  submitCredentialAccept(input: {
    subjectWalletAddress: string;
    subjectWalletSeed?: string;
    issuerWallet: string;
    credentialType: string;
  }): Promise<CredentialAcceptSubmission>;
  submitOracleSet(input: {
    symbol: string;
    value: number;
    scale?: number;
    source: string;
  }): Promise<OracleSetSubmission>;
  submitSeriesOffer(input: {
    sellerWalletAddress: string;
    sellerWalletSeed?: string;
    seriesCurrencyHex: string;
    seriesIssuer?: string;
    quantity: number;
    unitPrice: number;
    expiresAt?: string;
  }): Promise<SeriesOfferSubmission>;
  submitSeriesBuy(input: {
    buyerWalletAddress: string;
    buyerWalletSeed?: string;
    seriesCurrencyHex: string;
    seriesIssuer?: string;
    quantity: number;
    unitPrice: number;
  }): Promise<SeriesBuySubmission>;
  submitSeriesRedeem(input: {
    holderWalletAddress: string;
    holderWalletSeed?: string;
    destinationWalletAddress: string;
    destinationWalletSeed?: string;
    seriesCurrencyHex: string;
    seriesIssuer?: string;
    quantity: number;
  }): Promise<SeriesRedeemSubmission>;
  submitProofNftMint(input: {
    ownerWalletAddress: string;
    ownerWalletSeed?: string;
    uri: string;
    taxon: number;
  }): Promise<ProofNftMintSubmission>;
  submitAmmCreate(input: {
    creatorWalletAddress: string;
    creatorWalletSeed?: string;
    amount1: { currency: string; issuer: string; value: string };
    amount2: { currency: string; issuer: string; value: string };
    tradingFee: number;
  }): Promise<AmmCreateSubmission>;
  submitAmmDeposit(input: {
    depositorWalletAddress: string;
    depositorWalletSeed?: string;
    asset1: { currency: string; issuer: string };
    asset2: { currency: string; issuer: string };
    amount?: { currency: string; issuer: string; value: string };
    amount2?: { currency: string; issuer: string; value: string };
    lpTokenOut?: { currency: string; issuer: string; value: string };
  }): Promise<AmmDepositSubmission>;
  submitAmmWithdraw(input: {
    withdrawerWalletAddress: string;
    withdrawerWalletSeed?: string;
    asset1: { currency: string; issuer: string };
    asset2: { currency: string; issuer: string };
    lpTokenIn?: { currency: string; issuer: string; value: string };
    amount?: { currency: string; issuer: string; value: string };
  }): Promise<AmmWithdrawSubmission>;
  getAmmInfo(input: {
    asset1: { currency: string; issuer: string };
    asset2: { currency: string; issuer: string };
  }): Promise<AmmInfoResult>;
  getAggregatePrice(input: {
    baseAsset: string;
    quoteAsset: string;
    oracles: Array<{ account: string; oracleDocumentId: number }>;
    trim?: number;
  }): Promise<OracleAggregateResult>;
}
