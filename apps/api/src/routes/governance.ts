import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { EventBus } from "../lib/event-bus";
import type { GovernanceService } from "../modules/governance-service";
import { requireRoles } from "../security/actor-context";
import { env } from "../config/env";

const createProposalSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  authorId: z.string().min(1)
});

const transitionProposalSchema = z.object({
  event: z.enum(["activate", "submit_review", "approve", "reject", "archive"])
});

interface GovernanceRouteOptions {
  service: GovernanceService;
  eventBus: EventBus;
}

export const governanceRoutes: FastifyPluginAsync<GovernanceRouteOptions> = async (app, options) => {
  app.get(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "support", "read_only"]
      })
    },
    async () => ({
      items: await options.service.listProposals()
    })
  );

  app.get(
    "/:proposalId",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "support", "read_only"]
      })
    },
    async (request) => {
      const params = z.object({ proposalId: z.string() }).parse(request.params);
      return options.service.getProposal(params.proposalId);
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
      const body = createProposalSchema.parse(request.body);
      const proposal = await options.service.createProposal(body);
      return reply.status(201).send(proposal);
    }
  );

  app.post(
    "/:proposalId/transition",
    {
      preHandler: requireRoles({
        anyOf: ["admin"],
        stepUp: true
      })
    },
    async (request, reply) => {
      const params = z.object({ proposalId: z.string() }).parse(request.params);
      const body = transitionProposalSchema.parse(request.body);
      const proposal = await options.service.transitionProposal({
        proposalId: params.proposalId,
        event: body.event,
        actorUserId: request.actor?.userId
      });

      return reply.status(201).send(proposal);
    }
  );

  app.delete(
    "/:proposalId",
    {
      preHandler: requireRoles({
        anyOf: ["admin"],
        stepUp: true
      })
    },
    async (request, reply) => {
      const params = z.object({ proposalId: z.string() }).parse(request.params);
      await options.service.deleteProposal({
        proposalId: params.proposalId,
        actorUserId: request.actor?.userId
      });

      return reply.status(204).send();
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

      const onProposalChanged = (payload: { proposalId: string; status: string }) => {
        socket.send(JSON.stringify({ type: "governance.proposal_changed", payload }));
      };

      options.eventBus.on("governance.proposal_changed", onProposalChanged);

      socket.on("close", () => {
        options.eventBus.off("governance.proposal_changed", onProposalChanged);
      });
    }
  );
};
