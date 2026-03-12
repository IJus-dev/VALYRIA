import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ValidationError } from "@valyria/domain";
import type { ProofService } from "../modules/proof-service";
import { requireRoles } from "../security/actor-context";

const createProofSchema = z.object({
  userId: z.string().optional(),
  offerId: z.string().optional(),
  artifactType: z.enum([
    "underwriting_report",
    "farm_document",
    "geo_photo",
    "delivery_receipt",
    "dispute_evidence"
  ]),
  commodity: z.string().min(3),
  uri: z.string().min(8),
  ipfsCid: z.string().optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  mintOnLedger: z.boolean().optional(),
  walletSeed: z.string().min(8).optional()
});

const mintProofSchema = z.object({
  walletSeed: z.string().min(8).optional()
});

interface ProofRouteOptions {
  service: ProofService;
}

export const proofRoutes: FastifyPluginAsync<ProofRouteOptions> = async (app, options) => {
  app.get(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "support", "read_only"]
      })
    },
    async (request) => {
      const query = z.object({ offerId: z.string().optional() }).parse(request.query);
      return {
        items: await options.service.listProofs(query.offerId)
      };
    }
  );

  app.get(
    "/:proofId",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations", "support", "read_only"]
      })
    },
    async (request) => {
      const params = z.object({ proofId: z.string() }).parse(request.params);
      return options.service.getProofDetails(params.proofId);
    }
  );

  app.post(
    "/",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations"]
      })
    },
    async (request, reply) => {
      const body = createProofSchema.parse(request.body);
      const proof = await options.service.createProof(body);
      return reply.status(201).send(proof);
    }
  );

  app.post(
    "/:proofId/mint",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations"],
        stepUp: true
      })
    },
    async (request, reply) => {
      const params = z.object({ proofId: z.string() }).parse(request.params);
      const body = mintProofSchema.parse(request.body);
      const result = await options.service.mintProofNft({
        proofId: params.proofId,
        ...(body.walletSeed ? { walletSeed: body.walletSeed } : {})
      });

      return reply.status(201).send(result);
    }
  );

  app.post(
    "/:proofId/upload",
    {
      preHandler: requireRoles({
        anyOf: ["admin", "compliance", "operations"]
      })
    },
    async (request, reply) => {
      const params = z.object({ proofId: z.string() }).parse(request.params);
      const file = await request.file();
      if (!file) throw new ValidationError("No file provided in request.");
      const content = await file.toBuffer();
      const proof = await options.service.uploadFile({
        proofId: params.proofId,
        content,
        filename: file.filename,
      });
      return reply.status(200).send(proof);
    }
  );
};
