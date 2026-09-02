"use client";

import { Label, ListBox, Select, toast } from "@heroui/react";
import { useState } from "react";
import { updatePurchaseOrderStockStatus } from "@/app/services/purchaseOrder/purchaseOrderService";
import {
  ORDER_STATUS,
  type PurchaseOrderStockStatus,
  STOCK_STATUS,
  STOCK_STATUSES,
} from "@/lib/purchase-orders/constants";
import { useHasPermission } from "@/lib/rbac/permission-context";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import type { PurchaseOrderStatusControlProps } from "./status-control-types";

const stockStatusClass: Record<PurchaseOrderStockStatus, string> = {
  [STOCK_STATUS.notReserved]: "border-slate-200 bg-slate-50 text-slate-700",
  [STOCK_STATUS.reserved]: "border-blue-200 bg-blue-50 text-blue-700",
  [STOCK_STATUS.withdrawn]: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function StockStatusControl({
  order,
  onUpdated,
}: PurchaseOrderStatusControlProps) {
  const canUpdate = useHasPermission(PERMISSIONS.ORDERS_UPDATE_STATUS);
  const [isLoading, setIsLoading] = useState(false);
  const isOperational = order.orderStatus === ORDER_STATUS.confirmed;

  if (!canUpdate) {
    return (
      <span
        className={`inline-flex min-w-52 items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold ${stockStatusClass[order.stockStatus]}`}
      >
        {order.stockStatus}
      </span>
    );
  }

  async function handleChange(status: PurchaseOrderStockStatus) {
    if (status === order.stockStatus) return;

    setIsLoading(true);
    try {
      const result = await updatePurchaseOrderStockStatus(order.id, status);

      if (!result.success) {
        toast(result.error);
        return;
      }

      onUpdated(result.order);
      toast("Status de estoque atualizado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Select
      aria-label={`Status de estoque do pedido #${order.number}`}
      isDisabled={!isOperational || isLoading}
      onSelectionChange={(key) => {
        const status = key?.toString() as PurchaseOrderStockStatus;
        if (STOCK_STATUSES.includes(status)) void handleChange(status);
      }}
      selectedKey={order.stockStatus}
      variant="secondary"
    >
      <Label className="sr-only">Estoque</Label>
      <Select.Trigger
        className={`min-w-52 border font-semibold ${stockStatusClass[order.stockStatus]}`}
      >
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {STOCK_STATUSES.map((status) => (
            <ListBox.Item id={status} key={status} textValue={status}>
              {status}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
