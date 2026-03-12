export const FEE_RATES = {
  LISTING_FEE_RATE: 0.0005,
  TRANSACTION_FEE_RATE: 0.001,
  SETTLEMENT_FEE_RATE: 0.0015,
} as const;

export type FeeType = "listing" | "transaction" | "settlement";

export interface FeeRecord {
  id: string;
  feeType: FeeType;
  entityType: string;
  entityId: string;
  baseAmount: number;
  feeRate: number;
  feeAmount: number;
  currency: string;
  createdAt: string;
}

export function calculateFee(baseAmount: number, feeRate: number): number {
  return Number((baseAmount * feeRate).toFixed(6));
}

export function createFeeRecord(input: {
  id: string;
  feeType: FeeType;
  entityType: string;
  entityId: string;
  baseAmount: number;
  feeRate: number;
  currency?: string;
  createdAt?: string;
}): FeeRecord {
  return {
    ...input,
    feeAmount: calculateFee(input.baseAmount, input.feeRate),
    currency: input.currency ?? "VEX",
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}
