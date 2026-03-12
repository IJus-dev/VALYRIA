import { z } from "zod";

export const oraclePublishSchema = z.object({
  symbol: z.string().min(1, "Informe o símbolo (ex: MLH/BRL)"),
  source: z.string().min(1, "Informe a fonte"),
  value: z.coerce.number().positive("Valor deve ser positivo"),
  scale: z.coerce.number().int().min(0, "Scale deve ser >= 0"),
});

export type OraclePublishInput = z.infer<typeof oraclePublishSchema>;
