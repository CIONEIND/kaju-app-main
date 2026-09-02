import type {
  PurchaseOrderFinancialStatus,
  PurchaseOrderOrderStatus,
  PurchaseOrderStockStatus,
} from "@/lib/purchase-orders/constants";

export interface PurchaseOrderItem {
  id: string;
  productId: number;
  productName: string | null;
  boxType: string;
  quantity: number;
  pricePerKg: number;
  totalWeight: number;
  totalPrice: number;
}

export interface PurchaseOrderSummary {
  id: string;
  number: number;
  date: string;
  clientName: string;
  orderStatus: PurchaseOrderOrderStatus;
  financialStatus: PurchaseOrderFinancialStatus;
  stockStatus: PurchaseOrderStockStatus;
  totalWeightKg: number;
  boxes: number;
  totalPrice: number;
  items: PurchaseOrderItem[];
  audits: PurchaseOrderAudit[];
}

export interface PurchaseOrderAudit {
  id: string;
  date: string;
  user: string;
  action: string;
  details: string;
}
