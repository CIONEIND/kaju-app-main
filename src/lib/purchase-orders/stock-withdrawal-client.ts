import type { STOCK_STATUS } from "@/lib/purchase-orders/constants";

interface MockWithdrawStockInput {
  orderId: string;
  orderNumber: number;
  stockStatus: typeof STOCK_STATUS.withdrawn;
}

export async function withdrawPurchaseOrderStock(
  input: MockWithdrawStockInput,
) {
  console.info("Mock stock withdrawal request", input);

  return {
    success: true,
    externalReference: `mock-withdrawal-${input.orderNumber}`,
  };
}
