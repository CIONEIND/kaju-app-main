import { z } from 'zod';


export const createPessoaSchema = z.object({
    nomePessoa: z.string().min(3),
    tipoPessoa: z.enum(["1","2"]),
    cpfCnpj: z.string(),
    rg: z.string().optional(),
    cdLlg: z.number().min(1),
    cdLgr: z.number().min(1),
    cdLoc: z.number().min(1),
    numLogradouro: z.string().optional(),
    cep: z.number().optional(),
    cdAve: z.enum(["84", "85"])
});


export type CreatePessoaSchemaType = z.infer<typeof createPessoaSchema>;