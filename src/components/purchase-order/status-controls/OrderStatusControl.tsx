"use client";

import { Label, ListBox, Select, toast } from "@heroui/react";
import { useState } from "react";
import { updatePurchaseOrderOrderStatus } from "@/app/services/purchaseOrder/purchaseOrderService";
import {
  ORDER_STATUS,
  ORDER_STATUSES,
  type PurchaseOrderOrderStatus,
} from "@/lib/purchase-orders/constants";
import { useHasPermission } from "@/lib/rbac/permission-context";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import type { PurchaseOrderStatusControlProps } from "./status-control-types";

const orderStatusClass: Record<PurchaseOrderOrderStatus, string> = {
  [ORDER_STATUS.draft]: "border-slate-200 bg-slate-50 text-slate-700",
  [ORDER_STATUS.confirmed]: "border-blue-200 bg-blue-50 text-blue-700",
  [ORDER_STATUS.canceled]: "border-red-200 bg-red-50 text-red-700",
};

function getOrderStatusOptions(
  currentStatus: PurchaseOrderOrderStatus,
): PurchaseOrderOrderStatus[] {
  if (currentStatus === ORDER_STATUS.draft) {
    return [ORDER_STATUS.draft, ORDER_STATUS.confirmed, ORDER_STATUS.canceled];
  }

  if (currentStatus === ORDER_STATUS.confirmed) {
    return [ORDER_STATUS.confirmed, ORDER_STATUS.canceled];
  }

  return [ORDER_STATUS.canceled];
}

export function OrderStatusControl({
  order,
  onUpdated,
}: PurchaseOrderStatusControlProps) {
  const canUpdate = useHasPermission(PERMISSIONS.ORDERS_UPDATE_STATUS);
  const [isLoading, setIsLoading] = useState(false);
  const options = getOrderStatusOptions(order.orderStatus);

  if (!canUpdate) {
    return (
      <span
        className={`inline-flex min-w-36 items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold ${orderStatusClass[order.orderStatus]}`}
      >
        {order.orderStatus}
      </span>
    );
  }

  async function handleChange(status: PurchaseOrderOrderStatus) {
    if (status === order.orderStatus) return;

    setIsLoading(true);
    try {
      const result = await updatePurchaseOrderOrderStatus(order.id, status);

      if (!result.success) {
        toast(result.error);
        return;
      }

      onUpdated(result.order);
      toast("Status do pedido atualizado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Select
      aria-label={`Status do pedido #${order.number}`}
      isDisabled={isLoading}
      onSelectionChange={(key) => {
        const status = key?.toString() as PurchaseOrderOrderStatus;
        if (ORDER_STATUSES.includes(status)) void handleChange(status);
      }}
      selectedKey={order.orderStatus}
      variant="secondary"
    >
      <Label className="sr-only">Pedido</Label>
      <Select.Trigger
        className={`min-w-36 border font-semibold ${orderStatusClass[order.orderStatus]}`}
      >
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((status) => (
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
