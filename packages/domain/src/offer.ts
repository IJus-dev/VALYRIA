import { ValidationError } from "./errors";
import { buildSeriesAlias, encodeSeriesCurrencyCode, type SeriesDescriptor } from "./series";

export type OfferStatus =
  | "draft"
  | "listed"
  | "partially_filled"
  | "filled"
  | "redeem_requested"
  | "settled"
  | "cancelled";

export type OfferExecutionLane = "local" | "xrpl_dex";

export interface OfferSeries {
  alias: string;
  currencyHex: string;
  descriptor: SeriesDescriptor;
}

export interface Offer {
  id: string;
  producerId: string;
  quantity: number;
  unitPrice: number;
  notional: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  status: OfferStatus;
  executionLane: OfferExecutionLane;
  series: OfferSeries;
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
  filledQuantity?: number;
}

export function createOffer(input: {
  id: string;
  producerId: string;
  quantity: number;
  unitPrice: number;
  expiresAt: string;
  descriptor: SeriesDescriptor;
  status?: OfferStatus;
  executionLane?: OfferExecutionLane;
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
  filledQuantity?: number;
  createdAt?: string;
}): Offer {
  if (input.quantity <= 0) {
    throw new ValidationError("Offer quantity must be greater than zero.");
  }

  if (input.unitPrice <= 0) {
    throw new ValidationError("Offer unit price must be greater than zero.");
  }

  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: input.id,
    producerId: input.producerId,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    notional: Number((input.quantity * input.unitPrice).toFixed(2)),
    expiresAt: input.expiresAt,
    createdAt,
    updatedAt: createdAt,
    status: input.status ?? "listed",
    executionLane: input.executionLane ?? "local",
    series: {
      alias: buildSeriesAlias(input.descriptor),
      currencyHex: encodeSeriesCurrencyCode(input.descriptor),
      descriptor: input.descriptor
    },
    ...(input.sellerWallet ? { sellerWallet: input.sellerWallet } : {}),
    ...(input.seriesIssuer ? { seriesIssuer: input.seriesIssuer } : {}),
    ...(input.quoteCurrency ? { quoteCurrency: input.quoteCurrency } : {}),
    ...(input.quoteIssuer ? { quoteIssuer: input.quoteIssuer } : {}),
    ...(input.ledgerHash ? { ledgerHash: input.ledgerHash } : {}),
    ...(typeof input.ledgerSequence === "number" ? { ledgerSequence: input.ledgerSequence } : {}),
    ...(typeof input.ledgerOfferSequence === "number"
      ? { ledgerOfferSequence: input.ledgerOfferSequence }
      : {}),
    ...(input.currentHolderId ? { currentHolderId: input.currentHolderId } : {}),
    ...(input.fillLedgerHash ? { fillLedgerHash: input.fillLedgerHash } : {}),
    ...(typeof input.fillLedgerSequence === "number"
      ? { fillLedgerSequence: input.fillLedgerSequence }
      : {}),
    ...(input.filledAt ? { filledAt: input.filledAt } : {}),
    ...(typeof input.filledQuantity === "number" ? { filledQuantity: input.filledQuantity } : {})
  };
}
