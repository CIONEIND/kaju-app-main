import { z } from "zod";

const medicao = z
  .number()
  .min(0, "A medição não pode ser negativa")
  .max(1000, "Valor fora da faixa esperada")
  .nullable()
  .optional();

export const salvarAnaliseF3PGI6Schema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use YYYY-MM-DD)"),
  hora: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (use HH:mm)")
    .optional(),
  responsavelCdUsr: z.number().int().positive("Responsável inválido"),
  loteId: z.number().int().positive("Selecione o lote"),
  tipoId: z.number().int().positive("Selecione o tipo"),
  t1Amendoa: medicao,
  t2Amendoa: medicao,
  t3Amendoa: medicao,
  t1Casca: medicao,
  t2Casca: medicao,
  t3Casca: medicao,
});

export type SalvarAnaliseF3PGI6SchemaType = z.infer<
  typeof salvarAnaliseF3PGI6Schema
>;