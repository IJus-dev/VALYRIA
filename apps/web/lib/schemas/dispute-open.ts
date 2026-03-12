import { z } from "zod";

export const disputeOpenSchema = z.object({
  redeemId: z.string().min(1, "Selecione um redeem"),
  openedByUserId: z.string().min(1, "Selecione o usuário"),
  reason: z.string().min(12, "Motivo deve ter pelo menos 12 caracteres"),
  evidenceUri: z.string().optional(),
});

export type DisputeOpenInput = z.infer<typeof disputeOpenSchema>;

export const disputeTransitionSchema = z.object({
  disputeId: z.string().min(1, "Selecione uma disputa"),
  event: z.string().min(1, "Selecione um evento"),
  resolutionSummary: z.string().optional(),
  bondDecision: z.string().optional(),
  slashPercentage: z.coerce.number().min(1).max(100).optional(),
});

export type DisputeTransitionInput = z.infer<typeof disputeTransitionSchema>;
