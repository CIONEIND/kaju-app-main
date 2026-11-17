import { z } from "zod";

const nivel = z
  .number()
  .min(0, "O nível não pode ser negativo")
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) <= 1e-9,
    "O nível deve ter no máximo 2 casas decimais",
  )
  .nullable()
  .optional();

const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");
const horaHHmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (use HH:mm)");

export const salvarAnaliseF6PGI6Schema = z
  .object({
    responsavelCdUsr: z.number().int().positive("Responsável inválido"),
    status: z.enum(["rascunho", "concluida"]).optional(),
    loteId: z.number().int().positive("Selecione o lote"),
    siloId: z.number().int().positive("Selecione o silo"),
    tipoId: z.number().int().positive("Selecione o tipo"),
    modoMedicao: z.enum(["vazio", "produto"]).default("vazio"),

    /* Leitura inicial */
    dataInicial: dataISO,
    horaInicial: horaHHmm.optional(),
    vazioInicial: nivel,

    /* Leitura final */
    dataFinal: dataISO.optional(),
    horaFinal: horaHHmm.optional(),
    vazioFinal: nivel,
  })
  .refine(
    (d) =>
      !d.dataFinal ||
      new Date(`${d.dataFinal}T${d.horaFinal ?? "00:00"}:00`) >=
        new Date(`${d.dataInicial}T${d.horaInicial ?? "00:00"}:00`),
    {
      message: "A leitura final não pode ser anterior à leitura inicial.",
      path: ["dataFinal"],
    },
  )
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