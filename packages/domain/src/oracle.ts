import { ValidationError } from "./errors";

export function splitOracleSymbol(symbol: string): { base: string; quote: string } {
  const [base, quote, ...rest] = symbol.split("/").map((item) => item.trim());

  if (!base || !quote || rest.length > 0) {
    throw new ValidationError(`Invalid oracle symbol "${symbol}". Expected format BASE/QUOTE.`);
  }

  return { base, quote };
}

export function deriveOracleDocumentId(symbol: string): number {
  let hash = 2166136261;

  for (const char of symbol) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) || 1;
}

export interface OraclePricePoint {
  id: string;
  symbol: string;
  source: string;
  value: number;
  publishedAt: string;
  metadata?: Record<string, string | number | boolean>;
}

export function createOraclePricePoint(input: {
  id: string;
  symbol: string;
  source: string;
  value: number;
  publishedAt?: string;
  metadata?: Record<string, string | number | boolean>;
}): OraclePricePoint {
  if (input.value <= 0) {
    throw new ValidationError("Oracle value must be greater than zero.");
  }

  return {
    id: input.id,
    symbol: input.symbol,
    source: input.source,
    value: input.value,
    publishedAt: input.publishedAt ?? new Date().toISOString(),
    ...(input.metadata ? { metadata: input.metadata } : {})
  };
}
