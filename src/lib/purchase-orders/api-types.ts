import type {
  PurchaseOrderFinancialStatus,
  PurchaseOrderOrderStatus,
  PurchaseOrderStockStatus,
} from "@/lib/purchase-orders/constants";

export interface UpdatePurchaseOrderOrderStatusPayload {
  orderStatus: PurchaseOrderOrderStatus;
}

export interface UpdatePurchaseOrderFinancialStatusPayload {
  financialStatus: PurchaseOrderFinancialStatus;
}

export interface UpdatePurchaseOrderStockStatusPayload {
  stockStatus: PurchaseOrderStockStatus;
}
