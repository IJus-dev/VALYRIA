import { z } from "zod";

export const proofCreateSchema = z.object({
  userId: z.string().min(1, "Selecione um usuário"),
  offerId: z.string().min(1, "Selecione uma oferta"),
  artifactType: z.string().min(1, "Selecione o tipo"),
  commodity: z.string().min(1, "Selecione a commodity"),
  uri: z.string().min(1, "URI obrigatória"),
  ipfsCid: z.string().optional(),
  metadata: z.string().optional(),
  walletSeed: z.string().optional(),
});

export type ProofCreateInput = z.infer<typeof proofCreateSchema>;
