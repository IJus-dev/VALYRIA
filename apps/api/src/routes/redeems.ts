import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { RedeemService } from "../modules/redeem-service";
import type { EventBus } from "../lib/event-bus";
import { env } from "../config/env";
import { requireRoles } from "../security/actor-context";

const transitionRedeemSchema = z.object({
  event: z.enum(["attach_tracking", "ship", "confirm_delivery", "accept", "open_dispute", "close"]),
  trackingCode: z.string().min(4).optional()
});

interface RedeemRouteOptions {
  service: RedeemService;
  eventBus: EventBus;
}

export const redeemRoutes: FastifyPluginAsync<RedeemRouteOptions> = async (app, options) => {
  app.get(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "support", "read_only"]
      })
    },
    async () => ({
      items: await options.service.listRedeems()
    })
  );

  app.get(
    "/:redeemId",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "support", "read_only"]
      })
    },
    async (request) => {
      const params = z.object({ redeemId: z.string() }).parse(request.params);
      return options.service.getRedeem(params.redeemId);
    }
  );

  app.post(
    "/:redeemId/transition",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "operations", "support"],
        stepUp: true
      })
    },
    async (request) => {
      const params = z.object({ redeemId: z.string() }).parse(request.params);
      const body = transitionRedeemSchema.parse(request.body);

      return options.service.transitionRedeem({
        redeemId: params.redeemId,
        event: body.event,
        actorUserId: request.actor?.userId,
        ...(body.trackingCode ? { trackingCode: body.trackingCode } : {})
      });
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

      const onRedeemChanged = (payload: { redeemId: string; from: string; to: string }) => {
        socket.send(JSON.stringify({ type: "redeem.state_changed", payload }));
      };

      options.eventBus.on("redeem.state_changed", onRedeemChanged);

      socket.on("close", () => {
        options.eventBus.off("redeem.state_changed", onRedeemChanged);
      });
    }
  );
};
