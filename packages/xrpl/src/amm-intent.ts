export interface AmmIssuedAmount {
  currency: string;
  issuer: string;
  value: string;
}

export interface AmmCreateIntent {
  creatorWallet: string;
  amount1: AmmIssuedAmount;
  amount2: AmmIssuedAmount;
  tradingFee: number;
  preflightChecks: string[];
}

export interface AmmDepositIntent {
  depositorWallet: string;
  asset1: { currency: string; issuer: string };
  asset2: { currency: string; issuer: string };
  amount?: AmmIssuedAmount;
  amount2?: AmmIssuedAmount;
  lpTokenOut?: AmmIssuedAmount;
  preflightChecks: string[];
}

export interface AmmWithdrawIntent {
  withdrawerWallet: string;
  asset1: { currency: string; issuer: string };
  asset2: { currency: string; issuer: string };
  lpTokenIn?: AmmIssuedAmount;
  amount?: AmmIssuedAmount;
  preflightChecks: string[];
}

function validateIssuedAmount(amount: AmmIssuedAmount, label: string): void {
  if (!amount.currency || amount.currency.length === 0) {
    throw new Error(`${label}: currency is required.`);
  }
  if (!amount.issuer || amount.issuer.length === 0) {
    throw new Error(`${label}: issuer is required.`);
  }
  const numericValue = Number(amount.value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error(`${label}: value must be a positive finite number string.`);
  }
}

export function buildAmmCreateIntent(input: {
  creatorWallet: string;
  amount1: AmmIssuedAmount;
  amount2: AmmIssuedAmount;
  tradingFee: number;
}): AmmCreateIntent {
  if (!input.creatorWallet) {
    throw new Error("AMMCreate requires a creator wallet.");
  }

  validateIssuedAmount(input.amount1, "amount1");
  validateIssuedAmount(input.amount2, "amount2");

  // TradingFee do XRPL AMM: 0-1000 (milésimos de porcento, 30 = 0.03%)
  if (!Number.isInteger(input.tradingFee) || input.tradingFee < 0 || input.tradingFee > 1000) {
    throw new Error("AMMCreate tradingFee must be an integer between 0 and 1000.");
  }

  if (
    input.amount1.currency === input.amount2.currency &&
    input.amount1.issuer === input.amount2.issuer
  ) {
    throw new Error("AMMCreate requires two distinct assets.");
  }

  return {
    creatorWallet: input.creatorWallet,
    amount1: input.amount1,
    amount2: input.amount2,
    tradingFee: input.tradingFee,
    preflightChecks: [
      "both_assets_are_issued_currencies",
      "trust_lines_exist_for_both_assets",
      "trading_fee_in_range_0_1000",
      "amm_does_not_already_exist_for_pair"
    ]
  };
}

export function buildAmmDepositIntent(input: {
  depositorWallet: string;
  asset1: { currency: string; issuer: string };
  asset2: { currency: string; issuer: string };
  amount?: AmmIssuedAmount;
  amount2?: AmmIssuedAmount;
  lpTokenOut?: AmmIssuedAmount;
}): AmmDepositIntent {
  if (!input.depositorWallet) {
    throw new Error("AMMDeposit requires a depositor wallet.");
  }

  if (!input.amount && !input.lpTokenOut) {
    throw new Error("AMMDeposit requires at least amount or lpTokenOut.");
  }

  if (input.amount) {
    validateIssuedAmount(input.amount, "deposit amount");
  }
  if (input.amount2) {
    validateIssuedAmount(input.amount2, "deposit amount2");
  }
  if (input.lpTokenOut) {
    validateIssuedAmount(input.lpTokenOut, "deposit lpTokenOut");
  }

  return {
    depositorWallet: input.depositorWallet,
    asset1: input.asset1,
    asset2: input.asset2,
    ...(input.amount ? { amount: input.amount } : {}),
    ...(input.amount2 ? { amount2: input.amount2 } : {}),
    ...(input.lpTokenOut ? { lpTokenOut: input.lpTokenOut } : {}),
    preflightChecks: [
      "amm_exists_for_pair",
      "depositor_has_trust_lines",
      "deposit_amount_positive"
    ]
  };
}

export function buildAmmWithdrawIntent(input: {
  withdrawerWallet: string;
  asset1: { currency: string; issuer: string };
  asset2: { currency: string; issuer: string };
  lpTokenIn?: AmmIssuedAmount;
  amount?: AmmIssuedAmount;
}): AmmWithdrawIntent {
  if (!input.withdrawerWallet) {
    throw new Error("AMMWithdraw requires a withdrawer wallet.");
  }

  if (!input.lpTokenIn && !input.amount) {
    throw new Error("AMMWithdraw requires at least lpTokenIn or amount.");
  }

  if (input.lpTokenIn) {
    validateIssuedAmount(input.lpTokenIn, "withdraw lpTokenIn");
  }
  if (input.amount) {
    validateIssuedAmount(input.amount, "withdraw amount");
  }

  return {
    withdrawerWallet: input.withdrawerWallet,
    asset1: input.asset1,
    asset2: input.asset2,
    ...(input.lpTokenIn ? { lpTokenIn: input.lpTokenIn } : {}),
    ...(input.amount ? { amount: input.amount } : {}),
    preflightChecks: [
      "amm_exists_for_pair",
      "withdrawer_holds_lp_tokens",
      "withdraw_amount_positive"
    ]
  };
}
