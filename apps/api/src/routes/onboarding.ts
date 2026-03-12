import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { OnboardingService } from "../modules/onboarding-service";
import { requireRoles } from "../security/actor-context";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).optional()
});

const transitionUserSchema = z.object({
  event: z.enum([
    "verify_email",
    "link_wallet",
    "submit_kyc",
    "approve_kyc",
    "reject_kyc",
    "approve_producer",
    "suspend",
    "reinstate"
  ]),
  walletAddress: z.string().min(10).optional()
});

interface OnboardingRouteOptions {
  service: OnboardingService;
}

export const onboardingRoutes: FastifyPluginAsync<OnboardingRouteOptions> = async (app, options) => {
  app.get(
    "/users",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "support", "read_only"]
      })
    },
    async () => ({
      items: await options.service.listUsers()
    })
  );

  app.post(
    "/users",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance"]
      })
    },
    async (request, reply) => {
      const body = createUserSchema.parse(request.body);
      const user = await options.service.createUser({
        email: body.email,
        ...(body.name ? { name: body.name } : {})
      });

      return reply.status(201).send(user);
    }
  );

  app.post(
    "/users/:userId/transition",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "support"],
        stepUp: true
      })
    },
    async (request) => {
      const params = z.object({ userId: z.string() }).parse(request.params);
      const body = transitionUserSchema.parse(request.body);

      return options.service.transitionUser({
        userId: params.userId,
        event: body.event,
        ...(body.walletAddress ? { walletAddress: body.walletAddress } : {})
      });
    }
  );
};
