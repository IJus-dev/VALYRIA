import { describe, it, expect } from "vitest";
import { buildAmmCreateIntent, buildAmmDepositIntent, buildAmmWithdrawIntent } from "../amm-intent";

describe("buildAmmCreateIntent", () => {
  const validInput = {
    creatorWallet: "rCreator111111111111111111111111111",
    amount1: { currency: "MLH", issuer: "rIssuer1111111111111111111111111111", value: "180000.0" },
    amount2: { currency: "VEX", issuer: "rIssuer2222222222222222222222222222", value: "11200000.0" },
    tradingFee: 30
  };

  it("cria intent com preflight checks", () => {
    const intent = buildAmmCreateIntent(validInput);

    expect(intent.creatorWallet).toBe(validInput.creatorWallet);
    expect(intent.amount1).toEqual(validInput.amount1);
    expect(intent.amount2).toEqual(validInput.amount2);
    expect(intent.tradingFee).toBe(30);
    expect(intent.preflightChecks.length).toBeGreaterThan(0);
  });

  it("rejeita tradingFee fora do range 0-1000", () => {
    expect(() => buildAmmCreateIntent({ ...validInput, tradingFee: -1 })).toThrow();
    expect(() => buildAmmCreateIntent({ ...validInput, tradingFee: 1001 })).toThrow();
    expect(() => buildAmmCreateIntent({ ...validInput, tradingFee: 1.5 })).toThrow();
  });

  it("aceita tradingFee nos limites", () => {
    expect(() => buildAmmCreateIntent({ ...validInput, tradingFee: 0 })).not.toThrow();
    expect(() => buildAmmCreateIntent({ ...validInput, tradingFee: 1000 })).not.toThrow();
  });

  it("rejeita assets identicos", () => {
    expect(() =>
      buildAmmCreateIntent({
        ...validInput,
        amount2: { ...validInput.amount1 }
      })
    ).toThrow();
  });

  it("rejeita valor nao-positivo", () => {
    expect(() =>
      buildAmmCreateIntent({
        ...validInput,
        amount1: { ...validInput.amount1, value: "0" }
      })
    ).toThrow();

    expect(() =>
      buildAmmCreateIntent({
        ...validInput,
        amount1: { ...validInput.amount1, value: "-100" }
      })
    ).toThrow();
  });

  it("rejeita creator wallet vazio", () => {
    expect(() => buildAmmCreateIntent({ ...validInput, creatorWallet: "" })).toThrow();
  });
});

describe("buildAmmDepositIntent", () => {
  const asset1 = { currency: "MLH", issuer: "rIssuer1111111111111111111111111111" };
  const asset2 = { currency: "VEX", issuer: "rIssuer2222222222222222222222222222" };

  it("cria intent com amount", () => {
    const intent = buildAmmDepositIntent({
      depositorWallet: "rDepositor11111111111111111111111111",
      asset1,
      asset2,
      amount: { ...asset1, value: "1000.0" }
    });

    expect(intent.depositorWallet).toBe("rDepositor11111111111111111111111111");
    expect(intent.amount).toBeDefined();
    expect(intent.preflightChecks.length).toBeGreaterThan(0);
  });

  it("cria intent com lpTokenOut", () => {
    const intent = buildAmmDepositIntent({
      depositorWallet: "rDepositor11111111111111111111111111",
      asset1,
      asset2,
      lpTokenOut: { currency: "LP_TOKEN", issuer: "rAmmAccount", value: "500.0" }
    });

    expect(intent.lpTokenOut).toBeDefined();
  });

  it("rejeita sem amount e sem lpTokenOut", () => {
    expect(() =>
      buildAmmDepositIntent({
        depositorWallet: "rDepositor11111111111111111111111111",
        asset1,
        asset2
      })
    ).toThrow();
  });
});

describe("buildAmmWithdrawIntent", () => {
  const asset1 = { currency: "MLH", issuer: "rIssuer1111111111111111111111111111" };
  const asset2 = { currency: "VEX", issuer: "rIssuer2222222222222222222222222222" };

  it("cria intent com lpTokenIn", () => {
    const intent = buildAmmWithdrawIntent({
      withdrawerWallet: "rWithdrawer1111111111111111111111111",
      asset1,
      asset2,
      lpTokenIn: { currency: "LP_TOKEN", issuer: "rAmmAccount", value: "500.0" }
    });

    expect(intent.withdrawerWallet).toBe("rWithdrawer1111111111111111111111111");
    expect(intent.lpTokenIn).toBeDefined();
    expect(intent.preflightChecks.length).toBeGreaterThan(0);
  });

  it("cria intent com amount", () => {
    const intent = buildAmmWithdrawIntent({
      withdrawerWallet: "rWithdrawer1111111111111111111111111",
      asset1,
      asset2,
      amount: { ...asset1, value: "1000.0" }
    });

    expect(intent.amount).toBeDefined();
  });

  it("rejeita sem lpTokenIn e sem amount", () => {
    expect(() =>
      buildAmmWithdrawIntent({
        withdrawerWallet: "rWithdrawer1111111111111111111111111",
        asset1,
        asset2
      })
    ).toThrow();
  });
});
