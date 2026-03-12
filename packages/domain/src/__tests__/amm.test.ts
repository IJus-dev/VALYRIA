import { describe, it, expect } from "vitest";
import { createAmmPool } from "../amm";
import { ValidationError } from "../errors";

function makePool() {
  return createAmmPool({
    id: "pool-1",
    pair: "VEX/MLH",
    baseAsset: "VEX",
    quoteAsset: "MLH",
    baseReserve: 10_000,
    quoteReserve: 50_000,
    feeBps: 30,
  });
}

describe("createAmmPool", () => {
  it("cria pool com defaults corretos", () => {
    const pool = makePool();
    expect(pool.feeBps).toBe(30);
    expect(pool.baseReserve).toBe(10_000);
    expect(pool.quoteReserve).toBe(50_000);
    expect(pool.isNative).toBe(false);
  });

  it("cria pool nativo com campos XRPL", () => {
    const pool = createAmmPool({
      id: "pool-native",
      pair: "MLH/VEX",
      baseAsset: "MLH",
      quoteAsset: "VEX",
      baseReserve: 180_000,
      quoteReserve: 11_200_000,
      feeBps: 30,
      ammAccountId: "rAmmAccount111111111111111111111111",
      lpTokenCurrency: "03A20924B3E48D2575F5B03B042B3E58BE55CF42",
      lpTokenIssuer: "rAmmAccount111111111111111111111111",
      isNative: true,
    });

    expect(pool.isNative).toBe(true);
    expect(pool.ammAccountId).toBe("rAmmAccount111111111111111111111111");
    expect(pool.lpTokenCurrency).toBeDefined();
    expect(pool.lpTokenIssuer).toBeDefined();
  });

  it("rejeita reserves <= 0", () => {
    expect(() =>
      createAmmPool({ id: "p", pair: "A/B", baseAsset: "A", quoteAsset: "B", baseReserve: 0, quoteReserve: 100 })
    ).toThrow(ValidationError);

    expect(() =>
      createAmmPool({ id: "p", pair: "A/B", baseAsset: "A", quoteAsset: "B", baseReserve: 100, quoteReserve: -1 })
    ).toThrow(ValidationError);
  });

  it("omite campos opcionais XRPL quando nao fornecidos", () => {
    const pool = makePool();
    expect(pool.ammAccountId).toBeUndefined();
    expect(pool.lpTokenCurrency).toBeUndefined();
    expect(pool.lpTokenIssuer).toBeUndefined();
    expect(pool.ammLedgerHash).toBeUndefined();
  });
});
