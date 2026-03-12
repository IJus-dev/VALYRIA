export interface MarketSummary {
  metrics: Array<{
    label: string;
    value: string;
    hint: string;
  }>;
  orderBook: Array<{
    id: string;
    series: string;
    quantity: number;
    unitPrice: number;
    notional: number;
    status: string;
    executionLane: "local" | "xrpl_dex";
    expiresAt: string;
    sellerWallet?: string;
    ledgerHash?: string;
    ledgerOfferSequence?: number;
  }>;
  lifecycle: Array<{
    step: string;
    title: string;
    description: string;
  }>;
  priceTrend: Array<{
    label: string;
    value: number;
  }>;
  accountTopology: Record<string, string>;
  networkStatus: {
    mode: "mock" | "real";
    networkId: number;
    connected: boolean;
    url?: string;
    ledgerVersion?: number;
  };
}

export interface CredentialListItem {
  id: string;
  userId: string;
  kind: string;
  status: string;
  subjectWallet?: string;
  ledgerCredentialId?: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface BondListItem {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  state: string;
  credentialIds: string[];
  ledgerHash?: string;
  ledgerSequence?: number;
  lockedAt?: string;
  frozenAt?: string;
}

export interface UserListItem {
  id: string;
  name?: string;
  email: string;
  walletAddress?: string;
  state: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OfferListItem {
  id: string;
  producerId: string;
  quantity: number;
  unitPrice: number;
  notional: number;
  status: string;
  executionLane: "local" | "xrpl_dex";
  expiresAt: string;
  sellerWallet?: string;
  seriesIssuer?: string;
  quoteCurrency?: string;
  quoteIssuer?: string;
  ledgerHash?: string;
  ledgerSequence?: number;
  ledgerOfferSequence?: number;
  currentHolderId?: string;
  fillLedgerHash?: string;
  fillLedgerSequence?: number;
  filledAt?: string;
  series: {
    alias: string;
    currencyHex: string;
  };
}

export interface OracleListItem {
  id: string;
  symbol: string;
  source: string;
  value: number;
  metadata?: Record<string, string | number | boolean>;
  publishedAt: string;
}

export interface ProofListItem {
  id: string;
  userId?: string;
  offerId?: string;
  artifactType: string;
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

export interface ProofDetail {
  proof: ProofListItem;
  offer?: {
    id: string;
    seriesAlias: string;
    status: string;
  };
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  relatedProofs: ProofListItem[];
}

export interface DisputeListItem {
  id: string;
  redeemId: string;
  tier: string;
  state: string;
  reason: string;
  bondId?: string;
  bondDecision?: string;
  slaDueAt?: string;
  resolvedAt?: string;
  resolutionSummary?: string;
  createdAt: string;
}

export interface AuditListItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface RedeemListItem {
  id: string;
  offerId: string;
  holderId: string;
  state: string;
  requestedAt: string;
  responseWindowDays: number;
  settlementWallet: string;
  settlementLedgerHash?: string;
  settlementLedgerSequence?: number;
  settlementTransferredAt?: string;
  trackingCode?: string;
  shippedAt?: string;
  deliveredAt?: string;
  acceptedAt?: string;
  closedAt?: string;
}

export interface OfferDetail {
  offer: OfferListItem;
  producer?: {
    id: string;
    name?: string;
    email: string;
    state: string;
    walletAddress?: string;
  };
  currentHolder?: {
    id: string;
    name?: string;
    email: string;
    state: string;
    walletAddress?: string;
  };
  proofs: ProofListItem[];
  redeems: RedeemListItem[];
}

export interface AmmPoolListItem {
  id: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  baseReserve: number;
  quoteReserve: number;
  feeBps: number;
  createdAt: string;
  updatedAt: string;
}
