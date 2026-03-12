import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { CredentialService } from "../modules/credential-service";
import type { WalletChallengeService } from "../modules/wallet-challenge-service";
import { requireAuthenticatedActor } from "../security/actor-context";

const createWalletChallengeSchema = z.object({
  walletAddress: z.string().min(10)
});

const verifyWalletChallengeSchema = z.object({
  challengeId: z.string(),
  signature: z.string().min(16),
  publicKey: z.string().min(16)
});

const acceptOwnCredentialSchema = z.object({
  ledgerCredentialId: z.string().min(4).optional(),
  walletSeed: z.string().min(8).optional()
});

interface AuthRouteOptions {
  service: WalletChallengeService;
  credentialService: CredentialService;
}

export const authRoutes: FastifyPluginAsync<AuthRouteOptions> = async (app, options) => {
  app.post(
    "/wallet-challenges",
    {
      preHandler: requireAuthenticatedActor()
    },
    async (request, reply) => {
      const body = createWalletChallengeSchema.parse(request.body);
      const actorUserId = request.actor?.userId;

      if (!actorUserId) {
        return reply.status(401).send({
          message: "Authenticated actor context is required."
        });
      }

      const challenge = await options.service.createChallenge({
        userId: actorUserId,
        walletAddress: body.walletAddress
      });

      return reply.status(201).send(challenge);
    }
  );

  app.post(
    "/wallet-verify",
    {
      preHandler: requireAuthenticatedActor()
    },
    async (request, reply) => {
      const body = verifyWalletChallengeSchema.parse(request.body);
      const actorUserId = request.actor?.userId;

      if (!actorUserId) {
        return reply.status(401).send({
          message: "Authenticated actor context is required."
        });
      }

      return options.service.verifyChallenge({
        ...body,
        actorUserId
      });
    }
  );

  app.get(
    "/me/credentials",
    {
      preHandler: requireAuthenticatedActor()
    },
    async (request, reply) => {
      const actorUserId = request.actor?.userId;

      if (!actorUserId) {
        return reply.status(401).send({
          message: "Authenticated actor context is required."
        });
      }

      return {
        items: await options.credentialService.listCredentials(actorUserId)
      };
    }
  );

  app.post(
    "/me/credentials/:credentialId/accept",
    {
      preHandler: requireAuthenticatedActor()
    },
    async (request, reply) => {
      const actorUserId = request.actor?.userId;

      if (!actorUserId) {
        return reply.status(401).send({
          message: "Authenticated actor context is required."
        });
      }

      const params = z.object({ credentialId: z.string() }).parse(request.params);
      const body = acceptOwnCredentialSchema.parse(request.body);

      return options.credentialService.acceptCredentialForUser({
        actorUserId,
        credentialId: params.credentialId,
        ...(body.ledgerCredentialId ? { ledgerCredentialId: body.ledgerCredentialId } : {}),
        ...(body.walletSeed ? { walletSeed: body.walletSeed } : {})
      });
    }
  );
};
