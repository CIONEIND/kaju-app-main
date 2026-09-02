export const ORDER_STATUSES = ["Orçamento", "Confirmado", "Cancelado"] as const;

export const FINANCIAL_STATUSES = [
  "Aguardando pagamento",
  "Pago",
  "Faturado via boleto",
] as const;

export const STOCK_STATUSES = [
  "Estoque não reservado",
  "Estoque reservado",
  "Produtos retirados",
] as const;

export const ORDER_STATUS = {
  draft: "Orçamento",
  confirmed: "Confirmado",
  canceled: "Cancelado",
} as const satisfies Record<string, PurchaseOrderOrderStatus>;

export const FINANCIAL_STATUS = {
  awaitingPayment: "Aguardando pagamento",
  paid: "Pago",
  billedViaBoleto: "Faturado via boleto",
} as const satisfies Record<string, PurchaseOrderFinancialStatus>;

export const STOCK_STATUS = {
  notReserved: "Estoque não reservado",
  reserved: "Estoque reservado",
  withdrawn: "Produtos retirados",
} as const satisfies Record<string, PurchaseOrderStockStatus>;

export type PurchaseOrderOrderStatus = (typeof ORDER_STATUSES)[number];
export type PurchaseOrderFinancialStatus = (typeof FINANCIAL_STATUSES)[number];
export type PurchaseOrderStockStatus = (typeof STOCK_STATUSES)[number];

export function isPurchaseOrderOrderStatus(
  value: unknown,
): value is PurchaseOrderOrderStatus {
  return ORDER_STATUSES.includes(value as PurchaseOrderOrderStatus);
}

export function isPurchaseOrderFinancialStatus(
  value: unknown,
): value is PurchaseOrderFinancialStatus {
  return FINANCIAL_STATUSES.includes(value as PurchaseOrderFinancialStatus);
}

export function isPurchaseOrderStockStatus(
  value: unknown,
): value is PurchaseOrderStockStatus {
  return STOCK_STATUSES.includes(value as PurchaseOrderStockStatus);
}
