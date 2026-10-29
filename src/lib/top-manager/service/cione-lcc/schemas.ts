import { z } from "zod";

const numero = z
  .number()
  .min(0, "O valor não pode ser negativo")
  .nullable()
  .optional();

export const salvarAnaliseLCCSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  hora: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (use HH:mm)")
    .optional(),
  responsavelCdUsr: z.number().int().positive("Responsável inválido"),
  status: z.enum(["rascunho", "concluida"]).optional(),
  loteId: z.number().int().positive("Selecione o lote"),
  origemId: z.number().int().positive("Selecione a origem"),
  viscosidade: numero,
  altura: numero,
  temperatura: numero,
});

export type SalvarAnaliseLCCSchemaType = z.infer<typeof salvarAnaliseLCCSchema>;