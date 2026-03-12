import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { OracleService } from "../modules/oracle-service";
import { requireRoles } from "../security/actor-context";

const previewOracleSchema = z.object({
  symbol: z.string().min(3),
  source: z.string().min(2),
  value: z.coerce.number().positive(),
  scale: z.coerce.number().int().min(0).max(8).optional()
});

interface OracleRouteOptions {
  service: OracleService;
}

export const oracleRoutes: FastifyPluginAsync<OracleRouteOptions> = async (app, options) => {
  app.get(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "read_only"]
      })
    },
    async (request) => {
      const query = z.object({ symbol: z.string().optional() }).parse(request.query);
      return {
        items: await options.service.listPrices(query.symbol)
      };
    }
  );

  app.post(
    "/preview",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations"]
      })
    },
    async (request) => {
      const body = previewOracleSchema.parse(request.body);
      return options.service.previewOracleSet(body);
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
      const body = previewOracleSchema.parse(request.body);
      const result = await options.service.publishPrice(body);

      return reply.status(201).send(result);
    }
  );

  app.get(
    "/aggregate/:symbol",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "read_only"]
      })
    },
    async (request) => {
      const params = z.object({ symbol: z.string().min(3) }).parse(request.params);
      const query = z.object({ trim: z.coerce.number().int().min(1).max(25).optional() }).parse(request.query);
      return options.service.getAggregatePrice({
        symbol: params.symbol,
        ...(typeof query.trim === "number" ? { trim: query.trim } : {})
      });
    }
  );
};
