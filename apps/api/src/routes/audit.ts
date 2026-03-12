import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { AuditService } from "../modules/audit-service";
import { requireRoles } from "../security/actor-context";

interface AuditRouteOptions {
  service: AuditService;
}

export const auditRoutes: FastifyPluginAsync<AuditRouteOptions> = async (app, options) => {
  app.get(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "support", "read_only"]
      })
    },
    async (request) => {
      const query = z.object({ limit: z.coerce.number().int().positive().max(200).optional() }).parse(request.query);
      return {
        items: await options.service.listLogs(query.limit)
      };
    }
  );
};
