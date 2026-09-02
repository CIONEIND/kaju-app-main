// src/schemas/purchaseOrder.ts
import { z } from "zod";

export type BoxType = "FULL" | "HALF";

export const BOX_WEIGHTS: Record<BoxType, number> = {
  FULL: 22.68,
  HALF: 11.34,
};

export const MOCK_PRODUCTS = [
  {
    id: "p1",
    name: "Castanha W1",
    minPricePerKg: 45.0,
    defaultPricePerKg: 50.0,
    stockKg: 500,
  },
  {
    id: "p2",
    name: "Castanha W2",
    minPricePerKg: 40.0,
    defaultPricePerKg: 44.0,
    stockKg: 50,
  }, // Low stock for testing
  {
    id: "p3",
    name: "Castanha Batoque",
    minPricePerKg: 30.0,
    defaultPricePerKg: 35.0,
    stockKg: 0,
  }, // Out of stock for testing
];

// export const MOCK_CLIENTS = [
//   { id: "c1", name: "Castanhas do Brasil Ltda", cnpj: "00.000.000/0001-00" },
//   { id: "c2", name: "Exportadora Nordeste S/A", cnpj: "11.111.111/0001-11" },
//   { id: "c3", name: "Caju Premium Comércio", cnpj: "22.222.222/0001-22" },
// ];

export const PAYMENT_TERMS = [
  { id: "pix", name: "PIX (À Vista)" },
  { id: "boleto", name: "Boleto" },
  { id: "transferencia_bancaria", name: "Transferência Bancária" },
];

export const poItemSchema = z.object({
  id: z.string(),
  productId: z.number().min(1, "Produto é obrigatório"),
  boxType: z.enum(["FULL", "HALF"]),
  quantity: z.number().min(1, "A quantidade deve ser maior que zero"),
  customPricePerKg: z.number().min(0.01, "Preço inválido"),
});

export const purchaseOrderSchema = z
  .object({
    clientId: z.string().min(1, "Selecione um cliente"),
    date: z.string().min(1, "Data é obrigatória"),
    paymentWay: z.string().min(1, "Selecione a forma de pagamento"),
    paymentTerms: z.string().min(1, "Selecione a condição de pagamento"),
    isPickup: z.boolean(),
    freightType: z.enum(["cif", "fob"]).optional(),
    freight: z.number().min(0, "O frete não pode ser negativo"),
    discount: z
      .number()
      .min(0, "O desconto percentual não pode ser negativo")
      .max(100, "O desconto percentual não pode ser maior que 100%"),

    items: z
      .array(poItemSchema)
      .min(1, "Adicione pelo menos um item ao pedido"),
  })
  .superRefine((data, context) => {
    if (!data.isPickup && !data.freightType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o tipo de frete (CIF ou FOB)",
        path: ["freightType"],
      });
    }
  });

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
