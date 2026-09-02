import type { PurchaseOrderSummary } from "@/app/(protected)/pedidos/types";
import type {
  UpdatePurchaseOrderFinancialStatusPayload,
  UpdatePurchaseOrderOrderStatusPayload,
  UpdatePurchaseOrderStockStatusPayload,
} from "@/lib/purchase-orders/api-types";
import type {
  PurchaseOrderFinancialStatus,
  PurchaseOrderOrderStatus,
  PurchaseOrderStockStatus,
} from "@/lib/purchase-orders/constants";

type StatusUpdateResult =
  | { success: true; order: PurchaseOrderSummary }
  | { success: false; error: string };

async function patchStatus<TPayload>(
  url: string,
  payload: TPayload,
): Promise<StatusUpdateResult> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      success: false,
      error: data?.message ?? "Não foi possível atualizar o pedido.",
    };
  }

  return { success: true, order: data as PurchaseOrderSummary };
}

export function updatePurchaseOrderOrderStatus(
  poId: string,
  orderStatus: PurchaseOrderOrderStatus,
) {
  const payload: UpdatePurchaseOrderOrderStatusPayload = { orderStatus };

  return patchStatus(`/api/purchase-orders/${poId}/order-status`, payload);
}

export function updatePurchaseOrderFinancialStatus(
  poId: string,
  financialStatus: PurchaseOrderFinancialStatus,
) {
  const payload: UpdatePurchaseOrderFinancialStatusPayload = {
    financialStatus,
  };

  return patchStatus(`/api/purchase-orders/${poId}/financial-status`, payload);
}

export function updatePurchaseOrderStockStatus(
  poId: string,
  stockStatus: PurchaseOrderStockStatus,
) {
  const payload: UpdatePurchaseOrderStockStatusPayload = { stockStatus };

  return patchStatus(`/api/purchase-orders/${poId}/stock-status`, payload);
}
