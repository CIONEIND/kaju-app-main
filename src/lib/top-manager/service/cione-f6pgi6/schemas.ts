import { z } from "zod";

/** Nível em metros, até 2 casas decimais, como na planilha */
const nivel = z
  .number()
  .min(0, "O nível não pode ser negativo")
  .refine(
    (v) => Math.round(v * 100) === v * 100,
    "O nível deve ter no máximo 2 casas decimais",
  )
  .nullable()
  .optional();

export const salvarAnaliseF6PGI6Schema = z
  .object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    hora: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (use HH:mm)")
      .optional(),
    responsavelCdUsr: z.number().int().positive("Responsável inválido"),
    status: z.enum(["rascunho", "concluida"]).optional(),
    loteId: z.number().int().positive("Selecione o lote"),
    siloId: z.number().int().positive("Selecione o silo"),
    tipoId: z.number().int().positive("Selecione o tipo"),
    competencia: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Competência inválida")
      .optional(),
    modoMedicao: z.enum(["vazio", "produto"]).default("vazio"),
    vazioInicial: nivel,
    vazioFinal: nivel,
  })
  .refine(
    (d) =>
      d.vazioInicial === null ||
      d.vazioInicial === undefined ||
      d.vazioFinal === null ||
      d.vazioFinal === undefined ||
      d.vazioFinal >= d.vazioInicial,
    {
      message:
        "O vazio final deve ser maior ou igual ao vazio inicial — o silo não pode encher durante o consumo.",
      path: ["vazioFinal"],
    },
  );

export type SalvarAnaliseF6PGI6SchemaType = z.infer<
  typeof salvarAnaliseF6PGI6Schema
>;