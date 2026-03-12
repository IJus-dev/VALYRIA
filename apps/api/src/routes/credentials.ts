import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { CredentialService } from "../modules/credential-service";
import { requireRoles } from "../security/actor-context";

const previewCredentialSchema = z.object({
  subjectWallet: z.string().min(10),
  credentialType: z.enum(["KYCApproved", "ProducerApproved"]),
  expiresAt: z.string().datetime().optional()
});

const createCredentialSchema = z.object({
  userId: z.string(),
  kind: z.enum(["KYCApproved", "ProducerApproved"]),
  expiresAt: z.string().datetime().optional()
});

const acceptCredentialSchema = z.object({
  ledgerCredentialId: z.string().min(4).optional(),
  walletSeed: z.string().min(8).optional()
});

interface CredentialRouteOptions {
  service: CredentialService;
}

export const credentialRoutes: FastifyPluginAsync<CredentialRouteOptions> = async (app, options) => {
  app.get(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "support", "read_only"]
      })
    },
    async (request) => {
      const query = z.object({ userId: z.string().optional() }).parse(request.query);
      return {
        items: await options.service.listCredentials(query.userId)
      };
    }
  );

  app.post(
    "/preview",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance"]
      })
    },
    async (request) => {
      const body = previewCredentialSchema.parse(request.body);
      return options.service.previewCredentialCreate(body);
    }
  );

  app.post(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance"],
        stepUp: true
      })
    },
    async (request, reply) => {
      const body = createCredentialSchema.parse(request.body);
      const result = await options.service.issueCredential({
        userId: body.userId,
        kind: body.kind,
        ...(body.expiresAt ? { expiresAt: body.expiresAt } : {})
      });

      return reply.status(201).send(result);
    }
  );

  app.post(
    "/:credentialId/accept",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations"],
        stepUp: true
      })
    },
    async (request) => {
      const params = z.object({ credentialId: z.string() }).parse(request.params);
      const body = acceptCredentialSchema.parse(request.body);

      return options.service.acceptCredential({
        credentialId: params.credentialId,
        ...(body.ledgerCredentialId ? { ledgerCredentialId: body.ledgerCredentialId } : {}),
        ...(body.walletSeed ? { walletSeed: body.walletSeed } : {})
      });
    }
  );
};
