import { z } from "zod";

export const bondCreateSchema = z.object({
  userId: z.string().min(1, "Selecione um usuário"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  credentialIds: z.string().min(1, "Informe pelo menos uma credential"),
  walletSeed: z.string().optional(),
});

export type BondCreateInput = z.infer<typeof bondCreateSchema>;

export const bondTransitionSchema = z.object({
  bondId: z.string().min(1, "Selecione um bond"),
  event: z.string().min(1, "Selecione um evento"),
});

export type BondTransitionInput = z.infer<typeof bondTransitionSchema>;
