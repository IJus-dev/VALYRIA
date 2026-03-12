import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { AmmService } from "../modules/amm-service";
import { requireRoles } from "../security/actor-context";

const quoteSwapSchema = z.object({
  poolId: z.string(),
  inputAsset: z.string().min(2),
  inputAmount: z.coerce.number().positive()
});

const createPoolSchema = z.object({
  creatorWalletAddress: z.string().min(1),
  creatorWalletSeed: z.string().optional(),
  baseAsset: z.string().min(1),
  quoteAsset: z.string().min(1),
  baseIssuer: z.string().min(1),
  quoteIssuer: z.string().min(1),
  baseAmount: z.string().min(1),
  quoteAmount: z.string().min(1),
  tradingFee: z.coerce.number().int().min(0).max(1000)
});

const issuedAmountSchema = z.object({
  currency: z.string().min(1),
  issuer: z.string().min(1),
  value: z.string().min(1)
});

const depositSchema = z.object({
  depositorWalletAddress: z.string().min(1),
  depositorWalletSeed: z.string().optional(),
  amount: issuedAmountSchema.optional(),
  amount2: issuedAmountSchema.optional(),
  lpTokenOut: issuedAmountSchema.optional()
});

const withdrawSchema = z.object({
  withdrawerWalletAddress: z.string().min(1),
  withdrawerWalletSeed: z.string().optional(),
  lpTokenIn: issuedAmountSchema.optional(),
  amount: issuedAmountSchema.optional()
});

interface AmmRouteOptions {
  service: AmmService;
}

export const ammRoutes: FastifyPluginAsync<AmmRouteOptions> = async (app, options) => {
  app.get("/pools", async () => ({
    items: await options.service.listPools()
  }));

  app.post(
    "/pools",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations"],
        stepUp: true
      })
    },
    async (request) => {
      const body = createPoolSchema.parse(request.body);
      return options.service.createPool({
        ...body,
        actorUserId: request.actor?.userId
      });
    }
  );

  app.post(
    "/pools/:poolId/deposit",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations"],
        stepUp: true
      })
    },
    async (request) => {
      const { poolId } = request.params as { poolId: string };
      const body = depositSchema.parse(request.body);
      return options.service.deposit(poolId, {
        ...body,
        actorUserId: request.actor?.userId
      });
    }
  );

  app.post(
    "/pools/:poolId/withdraw",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations"],
        stepUp: true
      })
    },
    async (request) => {
      const { poolId } = request.params as { poolId: string };
      const body = withdrawSchema.parse(request.body);
      return options.service.withdraw(poolId, {
        ...body,
        actorUserId: request.actor?.userId
      });
    }
  );

  app.post("/quote", async (request) => {
    const body = quoteSwapSchema.parse(request.body);
    return options.service.quoteSwap(body);
  });

  app.post(
    "/swap",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations"],
        stepUp: true
      })
    },
    async (request) => {
      const body = quoteSwapSchema.parse(request.body);
      return options.service.executeSwap({
        ...body,
        actorUserId: request.actor?.userId
      });
    }
  );
};
