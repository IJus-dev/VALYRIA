import { z } from "zod";

export const proposalCreateSchema = z.object({
  code: z.string().min(1, "Código obrigatório").regex(/^VAL-\d{3}$/, "Formato: VAL-XXX"),
  title: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  summary: z.string().min(10, "Resumo deve ter pelo menos 10 caracteres"),
  authorId: z.string().min(1, "Selecione um autor"),
  status: z.enum(["draft", "active", "review", "approved", "rejected", "archived"]),
});

export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;
