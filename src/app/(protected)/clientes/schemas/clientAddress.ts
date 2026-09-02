import { unmaskCpfCnpj } from '@/utils/masks';
import { isValidAlphanumericCnpj, isValidCpf } from '@/utils/validation';
import { z } from "zod";

export const createClientSchema = z.object({
  // --- NEW: Client Fields ---
  nomePessoa: z.string().min(1, "Nome é obrigatório"),
  tipoPessoa: z.enum(["1", "2"]), // 1: Jurídica, 2: Física
  cpfCnpj: z.string().transform(unmaskCpfCnpj),
  rg: z.string().optional(),
  cdAve: z.enum(["84", "85"]), // 84: Interno, 85: Externo
  cdInf: z.enum(["1", "5", "6"]), // 1: Real, 5: Dólar, 6: Euro

  // --- EXISTING: Address Fields ---
  country: z.string().optional(),
  isBrazil: z.boolean(),
  postalCode: z.string().min(1, "Este campo é obrigatório"),
  street: z.string().min(1, "Este campo é obrigatório"),
  streetNumber: z.string().min(1, "Este campo é obrigatório"),
  neighborhood: z.string().min(1, "Este campo é obrigatório"),
  city: z.string().min(1, "Este campo é obrigatório"),
  state: z.string().min(1, "Este campo é obrigatório"),
  complement: z.string().optional(),
})
  .superRefine((data, ctx) => {
    if (data.isBrazil) {
      console.log("ENDERECO NO BNRASILLL")
      const isValid = data.tipoPessoa === "2" ? isValidCpf(data.cpfCnpj) : isValidAlphanumericCnpj(data.cpfCnpj);

      if(!isValid) {
        ctx.addIssue({ code:  "custom", path: ["cpfCnpj"], message: data.tipoPessoa === "2" ? "CPF inválido" : "CNPJ inválido"})
      }
    }
  })
;

export type CreateClientSchemaType = z.infer<typeof createClientSchema>;