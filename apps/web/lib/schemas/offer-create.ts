import { z } from "zod";

export const offerCreateSchema = z.object({
  producerId: z.string().min(1, "Selecione um produtor"),
  commodity: z.string().length(3, "Commodity deve ter 3 caracteres"),
  region: z.string().length(2, "Região deve ter 2 caracteres"),
  year: z.coerce.number().min(2020).max(2100),
  cycle: z.string().length(2, "Ciclo deve ter 2 caracteres"),
  grade: z.string().length(2, "Grade deve ter 2 caracteres"),
  lotUnit: z.string().length(2, "Lot unit deve ter 2 caracteres"),
  sequence: z.coerce.number().int().positive("Sequência deve ser positiva"),
  quantity: z.coerce.number().positive("Quantidade deve ser positiva"),
  unitPrice: z.coerce.number().positive("Preço deve ser positivo"),
  expiresAt: z.string().min(1, "Data de expiração obrigatória"),
  walletSeed: z.string().optional(),
});

export type OfferCreateInput = z.infer<typeof offerCreateSchema>;
