import type { PurchaseOrderSummary } from "@/app/(protected)/pedidos/types";

export interface PurchaseOrderStatusControlProps {
  order: PurchaseOrderSummary;
  onUpdated: (order: PurchaseOrderSummary) => void;
}
