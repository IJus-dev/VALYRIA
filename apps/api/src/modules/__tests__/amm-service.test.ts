import { describe, it, expect, beforeEach } from "vitest";
import { AmmService } from "../amm-service";
import { InMemoryPlatformRepository } from "../../adapters/storage/in-memory-platform-repository";
import { MockXrplGateway } from "../../adapters/xrpl/mock-xrpl-gateway";

describe("AmmService", () => {
  let service: AmmService;
  let repository: InMemoryPlatformRepository;
  let gateway: MockXrplGateway;

  beforeEach(() => {
    repository = new InMemoryPlatformRepository();
    gateway = new MockXrplGateway();
    service = new AmmService(repository, gateway);
  });

  describe("listPools", () => {
    it("retorna pools do seed", async () => {
      const pools = await service.listPools();
      expect(pools.length).toBeGreaterThan(0);
    });
  });

  describe("getPool", () => {
    it("retorna pool existente", async () => {
      const pool = await service.getPool("pool_mlh_vex");
      expect(pool.pair).toBe("MLH/VEX");
    });

    it("lanca NotFoundError pra pool inexistente", async () => {
      await expect(service.getPool("nonexistent")).rejects.toThrow("not found");
    });
  });

  describe("createPool", () => {
    it("cria pool nativo via gateway e persiste", async () => {
      const pool = await service.createPool({
        creatorWalletAddress: "rCreator111111111111111111111111111",
        baseAsset: "SOJ",
        quoteAsset: "VEX",
        baseIssuer: "rIssuer1111111111111111111111111111",
        quoteIssuer: "rIssuer2222222222222222222222222222",
        baseAmount: "50000.0",
        quoteAmount: "3000000.0",
        tradingFee: 30
      });

      expect(pool.pair).toBe("SOJ/VEX");
      expect(pool.isNative).toBe(true);
      expect(pool.ammAccountId).toBe("rMockAmmAccount1111111111111111111111");
      expect(pool.baseReserve).toBe(50000);
      expect(pool.quoteReserve).toBe(3000000);

      // Verifica persistencia
      const fetched = await service.getPool(pool.id);
      expect(fetched.id).toBe(pool.id);
    });
  });

  describe("deposit", () => {
    it("executa deposito via gateway", async () => {
      const result = await service.deposit("pool_mlh_vex", {
        depositorWalletAddress: "rDepositor11111111111111111111111111",
        amount: { currency: "MLH", issuer: "rIssuer", value: "1000.0" }
      });

      expect(result.pool.id).toBe("pool_mlh_vex");
    });

    it("lanca NotFoundError pra pool inexistente", async () => {
      await expect(
        service.deposit("nonexistent", {
          depositorWalletAddress: "rDepositor11111111111111111111111111",
          amount: { currency: "MLH", issuer: "rIssuer", value: "1000.0" }
        })
      ).rejects.toThrow("not found");
    });
  });

  describe("withdraw", () => {
    it("executa withdraw via gateway", async () => {
      const result = await service.withdraw("pool_mlh_vex", {
        withdrawerWalletAddress: "rWithdrawer1111111111111111111111111",
        lpTokenIn: { currency: "LP", issuer: "rAmm", value: "500.0" }
      });

      expect(result.pool.id).toBe("pool_mlh_vex");
    });
  });

  describe("quoteSwap", () => {
    it("calcula quote base → quote", async () => {
      const { quote } = await service.quoteSwap({
        poolId: "pool_mlh_vex",
        inputAsset: "MLH",
        inputAmount: 100
      });

      expect(quote.inputAsset).toBe("MLH");
      expect(quote.outputAsset).toBe("VEX");
      expect(quote.outputAmount).toBeGreaterThan(0);
      expect(quote.feeAmount).toBeGreaterThan(0);
    });

    it("calcula quote quote → base", async () => {
      const { quote } = await service.quoteSwap({
        poolId: "pool_mlh_vex",
        inputAsset: "VEX",
        inputAmount: 10000
      });

      expect(quote.inputAsset).toBe("VEX");
      expect(quote.outputAsset).toBe("MLH");
      expect(quote.outputAmount).toBeGreaterThan(0);
    });

    it("rejeita amount <= 0", async () => {
      await expect(
        service.quoteSwap({ poolId: "pool_mlh_vex", inputAsset: "MLH", inputAmount: 0 })
      ).rejects.toThrow();
    });

    it("rejeita asset desconhecido", async () => {
      await expect(
        service.quoteSwap({ poolId: "pool_mlh_vex", inputAsset: "UNKNOWN", inputAmount: 100 })
      ).rejects.toThrow();
    });
  });

  describe("executeSwap", () => {
    it("executa swap e registra audit log", async () => {
      const { pool, quote } = await service.executeSwap({
        poolId: "pool_mlh_vex",
        inputAsset: "MLH",
        inputAmount: 100,
        actorUserId: "usr_producer_1"
      });

      expect(pool.id).toBe("pool_mlh_vex");
      expect(quote.outputAmount).toBeGreaterThan(0);
    });
  });
});
