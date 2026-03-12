import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { DisputeService } from "../modules/dispute-service";
import type { EventBus } from "../lib/event-bus";
import { env } from "../config/env";
import { requireRoles } from "../security/actor-context";

const openDisputeSchema = z.object({
  redeemId: z.string(),
  openedByUserId: z.string(),
  reason: z.string().min(12),
  evidenceUri: z.string().optional()
});

const transitionDisputeSchema = z.object({
  event: z.enum(["start_review", "escalate", "resolve", "reject"]),
  resolutionSummary: z.string().min(12).optional(),
  bondDecision: z.enum(["restore_lock", "slash_partial", "forfeit"]).optional(),
  slashPercentage: z.coerce.number().min(1).max(100).optional()
});

interface DisputeRouteOptions {
  service: DisputeService;
  eventBus: EventBus;
}

export const disputeRoutes: FastifyPluginAsync<DisputeRouteOptions> = async (app, options) => {
  app.get(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "support", "read_only"]
      })
    },
    async () => ({
      items: await options.service.listDisputes()
    })
  );

  app.post(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations", "support"],
        stepUp: true
      })
    },
    async (request, reply) => {
      const body = openDisputeSchema.parse(request.body);
      const dispute = await options.service.openDispute(body);
      return reply.status(201).send(dispute);
    }
  );

  app.post(
    "/:disputeId/transition",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations", "support"],
        stepUp: true
      })
    },
    async (request, reply) => {
      const params = z.object({ disputeId: z.string() }).parse(request.params);
      const body = transitionDisputeSchema.parse(request.body);
      const result = await options.service.transitionDispute({
        disputeId: params.disputeId,
        event: body.event,
        actorUserId: request.actor?.userId,
        ...(body.resolutionSummary ? { resolutionSummary: body.resolutionSummary } : {}),
        ...(body.bondDecision ? { bondDecision: body.bondDecision } : {}),
        ...(typeof body.slashPercentage === "number" ? { slashPercentage: body.slashPercentage } : {})
      });

      return reply.status(201).send(result);
    }
  );

  app.get(
    "/stream",
    { websocket: true },
    (socket, request) => {
      const url = new URL(request.url, `http://${request.hostname}`);
      const token = url.searchParams.get("token");

      if (token !== env.INTERNAL_API_TOKEN) {
        socket.close(4001, "Unauthorized");
        return;
      }

      const onDisputeChanged = (payload: { disputeId: string; from: string; to: string }) => {
        socket.send(JSON.stringify({ type: "dispute.state_changed", payload }));
      };

      options.eventBus.on("dispute.state_changed", onDisputeChanged);

      socket.on("close", () => {
        options.eventBus.off("dispute.state_changed", onDisputeChanged);
      });
    }
  );
};
