import { NotFoundError, ValidationError, type AmmPool, type AmmQuote } from "@valyria/domain";
import { resolveAuditActorUserId } from "./audit-actor";
import type { PlatformRepository } from "./platform-repository";
import type { XrplGateway, AmmInfoResult } from "../adapters/xrpl/xrpl-gateway";

export class AmmService {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly xrplGateway: XrplGateway
  ) {}

  async listPools(): Promise<AmmPool[]> {
    return this.repository.listAmmPools();
  }

  async getPool(poolId: string): Promise<AmmPool> {
    const pool = await this.repository.getAmmPool(poolId);

    if (!pool) {
      throw new NotFoundError("AMM pool", poolId);
    }

    return pool;
  }

  async createPool(input: {
    creatorWalletAddress: string;
    creatorWalletSeed?: string;
    baseAsset: string;
    quoteAsset: string;
    baseIssuer: string;
    quoteIssuer: string;
    baseAmount: string;
    quoteAmount: string;
    tradingFee: number;
    actorUserId?: string;
  }): Promise<AmmPool> {
    const pair = `${input.baseAsset}/${input.quoteAsset}`;

    const submission = await this.xrplGateway.submitAmmCreate({
      creatorWalletAddress: input.creatorWalletAddress,
      creatorWalletSeed: input.creatorWalletSeed,
      amount1: { currency: input.baseAsset, issuer: input.baseIssuer, value: input.baseAmount },
      amount2: { currency: input.quoteAsset, issuer: input.quoteIssuer, value: input.quoteAmount },
      tradingFee: input.tradingFee
    });

    const pool = await this.repository.upsertAmmPool({
      id: crypto.randomUUID(),
      pair,
      baseAsset: input.baseAsset,
      quoteAsset: input.quoteAsset,
      baseReserve: Number(input.baseAmount),
      quoteReserve: Number(input.quoteAmount),
      feeBps: input.tradingFee,
      ammAccountId: submission.ammAccountId,
      isNative: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const actorUserId = await resolveAuditActorUserId(this.repository, input.actorUserId);
    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(actorUserId ? { actorUserId } : {}),
      action: "amm.pool.created",
      entityType: "amm_pool",
      entityId: pool.id,
      payload: {
        pair,
        ammAccountId: submission.ammAccountId,
        tradingFee: input.tradingFee,
        txHash: submission.receipt.hash
      },
      createdAt: new Date().toISOString()
    });

    return pool;
  }

  async deposit(poolId: string, input: {
    depositorWalletAddress: string;
    depositorWalletSeed?: string;
    amount?: { currency: string; issuer: string; value: string };
    amount2?: { currency: string; issuer: string; value: string };
    lpTokenOut?: { currency: string; issuer: string; value: string };
    actorUserId?: string;
  }): Promise<{ pool: AmmPool }> {
    const pool = await this.getPool(poolId);

    const submission = await this.xrplGateway.submitAmmDeposit({
      depositorWalletAddress: input.depositorWalletAddress,
      depositorWalletSeed: input.depositorWalletSeed,
      asset1: { currency: pool.baseAsset, issuer: this.resolveIssuer(pool, "base") },
      asset2: { currency: pool.quoteAsset, issuer: this.resolveIssuer(pool, "quote") },
      ...(input.amount ? { amount: input.amount } : {}),
      ...(input.amount2 ? { amount2: input.amount2 } : {}),
      ...(input.lpTokenOut ? { lpTokenOut: input.lpTokenOut } : {})
    });

    const actorUserId = await resolveAuditActorUserId(this.repository, input.actorUserId);
    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(actorUserId ? { actorUserId } : {}),
      action: "amm.deposit.executed",
      entityType: "amm_pool",
      entityId: pool.id,
      payload: {
        pair: pool.pair,
        txHash: submission.receipt.hash
      },
      createdAt: new Date().toISOString()
    });

    return { pool };
  }

  async withdraw(poolId: string, input: {
    withdrawerWalletAddress: string;
    withdrawerWalletSeed?: string;
    lpTokenIn?: { currency: string; issuer: string; value: string };
    amount?: { currency: string; issuer: string; value: string };
    actorUserId?: string;
  }): Promise<{ pool: AmmPool }> {
    const pool = await this.getPool(poolId);

    const submission = await this.xrplGateway.submitAmmWithdraw({
      withdrawerWalletAddress: input.withdrawerWalletAddress,
      withdrawerWalletSeed: input.withdrawerWalletSeed,
      asset1: { currency: pool.baseAsset, issuer: this.resolveIssuer(pool, "base") },
      asset2: { currency: pool.quoteAsset, issuer: this.resolveIssuer(pool, "quote") },
      ...(input.lpTokenIn ? { lpTokenIn: input.lpTokenIn } : {}),
      ...(input.amount ? { amount: input.amount } : {})
    });

    const actorUserId = await resolveAuditActorUserId(this.repository, input.actorUserId);
    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(actorUserId ? { actorUserId } : {}),
      action: "amm.withdraw.executed",
      entityType: "amm_pool",
      entityId: pool.id,
      payload: {
        pair: pool.pair,
        txHash: submission.receipt.hash
      },
      createdAt: new Date().toISOString()
    });

    return { pool };
  }

  async quoteSwap(input: {
    poolId: string;
    inputAsset: string;
    inputAmount: number;
  }): Promise<{
    pool: AmmPool;
    quote: AmmQuote;
  }> {
    if (input.inputAmount <= 0) {
      throw new ValidationError("Swap input amount must be positive.");
    }

    const pool = await this.getPool(input.poolId);

    // Pool nativo: buscar reservas atualizadas via amm_info
    let baseReserve = pool.baseReserve;
    let quoteReserve = pool.quoteReserve;

    if (pool.isNative) {
      try {
        const ammInfo = await this.xrplGateway.getAmmInfo({
          asset1: { currency: pool.baseAsset, issuer: this.resolveIssuer(pool, "base") },
          asset2: { currency: pool.quoteAsset, issuer: this.resolveIssuer(pool, "quote") }
        });
        baseReserve = Number(ammInfo.amount1.value);
        quoteReserve = Number(ammInfo.amount2.value);
      } catch {
        // Fallback pra reservas em cache se amm_info falhar
      }
    }

    const quote = this.computeConstantProductQuote(
      pool,
      baseReserve,
      quoteReserve,
      input.inputAsset,
      input.inputAmount
    );

    return { pool, quote };
  }

  async executeSwap(input: {
    poolId: string;
    inputAsset: string;
    inputAmount: number;
    actorUserId?: string;
  }): Promise<{
    pool: AmmPool;
    quote: AmmQuote;
  }> {
    const { pool, quote } = await this.quoteSwap(input);
    const actorUserId = await resolveAuditActorUserId(this.repository, input.actorUserId);

    await this.repository.createAuditLog({
      id: crypto.randomUUID(),
      ...(actorUserId ? { actorUserId } : {}),
      action: "amm.swap.executed",
      entityType: "amm_pool",
      entityId: pool.id,
      payload: {
        pair: pool.pair,
        inputAsset: quote.inputAsset,
        inputAmount: quote.inputAmount,
        outputAsset: quote.outputAsset,
        outputAmount: quote.outputAmount
      },
      createdAt: new Date().toISOString()
    });

    return { pool, quote };
  }

  // Cotação constant-product local (mesmo cálculo do XRPL AMM)
  private computeConstantProductQuote(
    pool: AmmPool,
    baseReserve: number,
    quoteReserve: number,
    inputAsset: string,
    inputAmount: number
  ): AmmQuote {
    const feeRate = pool.feeBps / 10_000;
    const feeAmount = inputAmount * feeRate;
    const netInput = inputAmount - feeAmount;
    const invariant = baseReserve * quoteReserve;

    if (inputAsset === pool.baseAsset) {
      const nextBaseReserve = baseReserve + netInput;
      const nextQuoteReserve = invariant / nextBaseReserve;
      const outputAmount = quoteReserve - nextQuoteReserve;
      const executionPrice = outputAmount / inputAmount;
      const midPrice = quoteReserve / baseReserve;

      return {
        inputAsset,
        inputAmount,
        outputAsset: pool.quoteAsset,
        outputAmount,
        feeAmount,
        executionPrice,
        midPrice,
        priceImpactPct: ((midPrice - executionPrice) / midPrice) * 100
      };
    }

    if (inputAsset === pool.quoteAsset) {
      const nextQuoteReserve = quoteReserve + netInput;
      const nextBaseReserve = invariant / nextQuoteReserve;
      const outputAmount = baseReserve - nextBaseReserve;
      const executionPrice = outputAmount / inputAmount;
      const midPrice = baseReserve / quoteReserve;

      return {
        inputAsset,
        inputAmount,
        outputAsset: pool.baseAsset,
        outputAmount,
        feeAmount,
        executionPrice,
        midPrice,
        priceImpactPct: ((midPrice - executionPrice) / midPrice) * 100
      };
    }

    throw new ValidationError("Input asset is not part of this pool.");
  }

  private resolveIssuer(pool: AmmPool, side: "base" | "quote"): string {
    // Usar topology do gateway como fallback pra issuer
    const topology = this.xrplGateway.getAccountTopology();
    return topology.coldIssuer;
  }
}
