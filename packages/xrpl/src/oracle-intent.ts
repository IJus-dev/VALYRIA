export interface OracleSetIntent {
  publisherWallet: string;
  symbol: string;
  value: number;
  scale: number;
  source: string;
  notes: string[];
}

export function buildOracleSetIntent(input: {
  publisherWallet: string;
  symbol: string;
  value: number;
  scale?: number;
  source: string;
}): OracleSetIntent {
  if (input.value <= 0) {
    throw new Error("Oracle values must be greater than zero.");
  }

  return {
    publisherWallet: input.publisherWallet,
    symbol: input.symbol,
    value: input.value,
    scale: input.scale ?? 2,
    source: input.source,
    notes: [
      "OracleSet should publish from a dedicated publisher wallet.",
      "Aggregate prices should be consumed from validated ledgers only."
    ]
  };
}
