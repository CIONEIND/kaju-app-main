import { z } from "zod";

const numeroOuNulo = z
  .union([z.number(), z.string(), z.null()])
  .transform((v) => {
    if (v === null || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  });

export const salvarAnaliseF5PGI6Schema = z.object({
  data: z.string().min(1, "Informe a data."),
  hora: z.string().optional(),
  loteId: z.number().int().positive("Informe o lote."),
  siloId: z.number().int().positive("Informe o silo."),
  tipoId: z.number().int().positive("Informe o tipo."),
  origemId: z.number().int().positive("Informe a origem."),
  responsavelCdUsr: z.number().int().positive(),
  t1Amendoa: numeroOuNulo,
  t2Amendoa: numeroOuNulo,
  t3Amendoa: numeroOuNulo,
  t1Casca: numeroOuNulo,
  t2Casca: numeroOuNulo,
  t3Casca: numeroOuNulo,
  status: z.enum(["rascunho", "concluida"]).default("rascunho"),
});

export type SalvarAnaliseF5PGI6SchemaType = z.infer<
  typeof salvarAnaliseF5PGI6Schema
>;