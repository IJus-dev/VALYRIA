export interface SeriesBuyAmount {
  currency: string;
  issuer: string;
  value: string;
}

export interface SeriesBuyIntent {
  buyerWallet: string;
  receive: SeriesBuyAmount;
  pay: SeriesBuyAmount;
  preflightChecks: string[];
  notes: string[];
}

export function buildSeriesBuyIntent(input: {
  buyerWallet: string;
  receive: SeriesBuyAmount;
  pay: SeriesBuyAmount;
}): SeriesBuyIntent {
  if (Number(input.receive.value) <= 0) {
    throw new Error("Series buy receive amount must be greater than zero.");
  }

  if (Number(input.pay.value) <= 0) {
    throw new Error("Series buy pay amount must be greater than zero.");
  }

  return {
    buyerWallet: input.buyerWallet,
    receive: input.receive,
    pay: input.pay,
    preflightChecks: [
      "validated_ledger_read",
      "buyer_wallet_signed",
      "buyer_trustlines_ready"
    ],
    notes: [
      "Buy-side OfferCreate may partially fill if insufficient liquidity exists on the book.",
      "Partial fills are tracked via filledQuantity; only fully filled offers set filledAt.",
      "Filled positions should be reconciled before redeem is enabled."
    ]
  };
}
