import { ValidationError } from "./errors";

export interface AmmPool {
  id: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  baseReserve: number;
  quoteReserve: number;
  feeBps: number;
  ammAccountId?: string;
  lpTokenCurrency?: string;
  lpTokenIssuer?: string;
  ammLedgerHash?: string;
  isNative: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AmmQuote {
  inputAsset: string;
  inputAmount: number;
  outputAsset: string;
  outputAmount: number;
  feeAmount: number;
  executionPrice: number;
  midPrice: number;
  priceImpactPct: number;
}

export function createAmmPool(input: {
  id: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  baseReserve: number;
  quoteReserve: number;
  feeBps?: number;
  ammAccountId?: string;
  lpTokenCurrency?: string;
  lpTokenIssuer?: string;
  ammLedgerHash?: string;
  isNative?: boolean;
  createdAt?: string;
}): AmmPool {
  const createdAt = input.createdAt ?? new Date().toISOString();

  if (input.baseReserve <= 0 || input.quoteReserve <= 0) {
    throw new ValidationError("AMM reserves must be positive.");
  }

  return {
    id: input.id,
    pair: input.pair,
    baseAsset: input.baseAsset,
    quoteAsset: input.quoteAsset,
    baseReserve: input.baseReserve,
    quoteReserve: input.quoteReserve,
    feeBps: input.feeBps ?? 30,
    ...(input.ammAccountId ? { ammAccountId: input.ammAccountId } : {}),
    ...(input.lpTokenCurrency ? { lpTokenCurrency: input.lpTokenCurrency } : {}),
    ...(input.lpTokenIssuer ? { lpTokenIssuer: input.lpTokenIssuer } : {}),
    ...(input.ammLedgerHash ? { ammLedgerHash: input.ammLedgerHash } : {}),
    isNative: input.isNative ?? false,
    createdAt,
    updatedAt: createdAt
  };
}
