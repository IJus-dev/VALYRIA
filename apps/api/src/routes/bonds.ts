import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { BondService } from "../modules/bond-service";
import { requireRoles } from "../security/actor-context";

const previewBondSchema = z.object({
  amount: z.coerce.number().positive(),
  credentialIds: z.array(z.string().min(3)).min(1),
  issuer: z.string().min(10).optional()
});

const createBondSchema = z.object({
  userId: z.string(),
  amount: z.coerce.number().positive(),
  credentialIds: z.array(z.string().min(3)).min(1),
  walletSeed: z.string().min(8).optional()
});

const transitionBondSchema = z.object({
  event: z.enum(["confirm_deposit", "freeze", "restore_lock", "slash_partial", "release", "forfeit"])
});

interface BondRouteOptions {
  service: BondService;
}

export const bondRoutes: FastifyPluginAsync<BondRouteOptions> = async (app, options) => {
  app.get(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "support", "read_only"]
      })
    },
    async () => ({
      items: await options.service.listBonds()
    })
  );

  app.post(
    "/preview",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations"]
      })
    },
    async (request) => {
      const body = previewBondSchema.parse(request.body);
      return options.service.previewDeposit({
        amount: body.amount,
        credentialIds: body.credentialIds,
        ...(body.issuer ? { issuer: body.issuer } : {})
      });
    }
  );

  app.post(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations"],
        stepUp: true
      })
    },
    async (request, reply) => {
      const body = createBondSchema.parse(request.body);
      const bond = await options.service.createBond(body);

      return reply.status(201).send(bond);
    }
  );

  app.post(
    "/:bondId/transition",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations"],
        stepUp: true
      })
    },
    async (request) => {
      const params = z.object({ bondId: z.string() }).parse(request.params);
      const body = transitionBondSchema.parse(request.body);

      return options.service.transitionBond({
        bondId: params.bondId,
        event: body.event
      });
    }
  );
};
