import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { PlatformRepository } from "../modules/platform-repository";

interface FeeRouteOptions {
  repository: PlatformRepository;
}

export const feeRoutes: FastifyPluginAsync<FeeRouteOptions> = async (app, options) => {
  app.get("/", async (request) => {
    const query = z
      .object({
        entityType: z.string().optional(),
        entityId: z.string().optional()
      })
      .parse(request.query);

    return {
      items: await options.repository.listFeeRecords(query.entityType, query.entityId)
    };
  });
};
