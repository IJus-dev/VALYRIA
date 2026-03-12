import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { MarketService } from "../modules/market-service";
import type { RedeemService } from "../modules/redeem-service";
import { requireRoles } from "../security/actor-context";

const createOfferSchema = z.object({
  producerId: z.string(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
  expiresAt: z.string().datetime(),
  walletSeed: z.string().min(8).optional(),
  descriptor: z.object({
    commodity: z.string().length(3),
    region: z.string().length(2),
    year: z.coerce.number().int().min(2000).max(65535),
    cycle: z.string().length(2),
    grade: z.string().length(2),
    lotUnit: z.string().length(2),
    sequence: z.coerce.number().int().min(0).max(4294967295),
    flags: z.coerce.number().int().min(0).max(65535).optional()
  })
});

const redeemSchema = z.object({
  holderId: z.string(),
  settlementWallet: z.string().min(10),
  responseWindowDays: z.coerce.number().int().min(3).max(7).optional(),
  walletSeed: z.string().min(8).optional()
});

const buyOfferSchema = z.object({
  holderId: z.string(),
  walletSeed: z.string().min(8).optional()
});

interface OfferRouteOptions {
  marketService: MarketService;
  redeemService: RedeemService;
}

export const offerRoutes: FastifyPluginAsync<OfferRouteOptions> = async (app, options) => {
  app.get("/", async () => ({
    items: await options.marketService.listOffers()
  }));

  app.get("/:offerId", async (request) => {
    const params = z.object({ offerId: z.string() }).parse(request.params);
    return options.marketService.getOfferDetails(params.offerId);
  });

  app.post(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations"],
        stepUp: true
      })
    },
    async (request, reply) => {
      const body = createOfferSchema.parse(request.body);
      const offer = await options.marketService.createOffer({
        producerId: body.producerId,
        quantity: body.quantity,
        unitPrice: body.unitPrice,
        expiresAt: body.expiresAt,
        descriptor: {
          commodity: body.descriptor.commodity,
          region: body.descriptor.region,
          year: body.descriptor.year,
          cycle: body.descriptor.cycle,
          grade: body.descriptor.grade,
          lotUnit: body.descriptor.lotUnit,
          sequence: body.descriptor.sequence,
          ...(typeof body.descriptor.flags === "number" ? { flags: body.descriptor.flags } : {})
        },
        ...(body.walletSeed ? { walletSeed: body.walletSeed } : {})
      });

      return reply.status(201).send(offer);
    }
  );

  app.post(
    "/:offerId/buy",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations"],
        stepUp: true
      })
    },
    async (request, reply) => {
      const params = z.object({ offerId: z.string() }).parse(request.params);
      const body = buyOfferSchema.parse(request.body);
      const result = await options.marketService.buyOffer({
        offerId: params.offerId,
        holderId: body.holderId,
        ...(body.walletSeed ? { walletSeed: body.walletSeed } : {})
      });

      return reply.status(201).send(result);
    }
  );

  app.post(
    "/:offerId/redeem",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations"],
        stepUp: true
      })
    },
    async (request) => {
      const params = z.object({ offerId: z.string() }).parse(request.params);
      const body = redeemSchema.parse(request.body);

      return options.redeemService.requestRedeem({
        offerId: params.offerId,
        holderId: body.holderId,
        settlementWallet: body.settlementWallet,
        ...(body.walletSeed ? { walletSeed: body.walletSeed } : {}),
        ...(typeof body.responseWindowDays === "number"
          ? { responseWindowDays: body.responseWindowDays }
          : {})
      });
    }
  );
};
