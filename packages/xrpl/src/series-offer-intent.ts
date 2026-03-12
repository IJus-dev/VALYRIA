export interface SeriesOfferAmount {
  currency: string;
  issuer: string;
  value: string;
}

export interface SeriesOfferIntent {
  sellerWallet: string;
  sell: SeriesOfferAmount;
  receive: SeriesOfferAmount;
  expiresAt?: string;
  preflightChecks: string[];
  notes: string[];
}

export function buildSeriesOfferIntent(input: {
  sellerWallet: string;
  sell: SeriesOfferAmount;
  receive: SeriesOfferAmount;
  expiresAt?: string;
}): SeriesOfferIntent {
  if (Number(input.sell.value) <= 0) {
    throw new Error("Series offer sell amount must be greater than zero.");
  }

  if (Number(input.receive.value) <= 0) {
    throw new Error("Series offer receive amount must be greater than zero.");
  }

  return {
    sellerWallet: input.sellerWallet,
    sell: input.sell,
    receive: input.receive,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    preflightChecks: [
      "validated_ledger_read",
      "seller_wallet_signed",
      "seller_trustlines_ready",
      "inventory_prefunded_before_offer_create"
    ],
    notes: [
      "Series inventory is issued as XRPL issued currency before the offer is placed on the DEX.",
      "OfferCreate should be reconciled with account_offers on validated ledgers only."
    ]
  };
}
