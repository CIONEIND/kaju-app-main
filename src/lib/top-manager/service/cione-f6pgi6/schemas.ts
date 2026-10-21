import { z } from "zod";

const numero = z
  .number()
  .min(0, "O valor não pode ser negativo")
  .nullable()
  .optional();

export const salvarAnaliseF6PGI6Schema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  hora: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (use HH:mm)")
    .optional(),
  responsavelCdUsr: z.number().int().positive("Responsável inválido"),
  loteId: z.number().int().positive("Selecione o lote"),
  siloId: z.number().int().positive("Selecione o silo"),
  tipoId: z.number().int().positive("Selecione o tipo"),
  cubagem: numero,
  consumo: numero,
});

export type SalvarAnaliseF6PGI6SchemaType = z.infer<
  typeof salvarAnaliseF6PGI6Schema
>;