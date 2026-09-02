import { z } from "zod";

export const createClienteSchema = z.object({
  nome: z.string().min(3),
  cdPes: z.number(),
  cdAve: z.enum(["84", "85"]),
  cdInf: z.enum(["1", "5", "6"]),
});

export const listClienteSchema = z.object({
  search: z.string().trim().optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateClienteSchemaType = z.infer<typeof createClienteSchema>;
export type ListClienteSchemaType = z.infer<typeof listClienteSchema>;
