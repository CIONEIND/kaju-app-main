"use client";

import { Label, ListBox, Select, toast, useOverlayState } from "@heroui/react";
import { useState } from "react";
import {
  updatePurchaseOrderFinancialStatus,
  updatePurchaseOrderStockStatus,
} from "@/app/services/purchaseOrder/purchaseOrderService";
import {
  FINANCIAL_STATUS,
  FINANCIAL_STATUSES,
  ORDER_STATUS,
  type PurchaseOrderFinancialStatus,
  STOCK_STATUS,
} from "@/lib/purchase-orders/constants";
import { useHasPermission } from "@/lib/rbac/permission-context";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { ConfirmPaymentStatusModal } from "./ConfirmPaymentStatusModal";
import { ReserveStockPromptModal } from "./ReserveStockPromptModal";
import type { PurchaseOrderStatusControlProps } from "./status-control-types";

const financialStatusClass: Record<PurchaseOrderFinancialStatus, string> = {
  [FINANCIAL_STATUS.awaitingPayment]:
    "border-amber-200 bg-amber-50 text-amber-800",
  [FINANCIAL_STATUS.paid]: "border-emerald-200 bg-emerald-50 text-emerald-700",
  [FINANCIAL_STATUS.billedViaBoleto]: "border-sky-200 bg-sky-50 text-sky-700",
};

const STATUSES_REQUIRING_CONFIRMATION: PurchaseOrderFinancialStatus[] = [
  FINANCIAL_STATUS.paid,
  FINANCIAL_STATUS.billedViaBoleto,
];

export function FinancialStatusControl({
  order,
  onUpdated,
}: PurchaseOrderStatusControlProps) {
  const canUpdate = useHasPermission(PERMISSIONS.ORDERS_UPDATE_STATUS);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingStatus, setPendingStatus] =
    useState<PurchaseOrderFinancialStatus>(FINANCIAL_STATUS.paid);
  const paymentConfirmState = useOverlayState();
  const reservePromptState = useOverlayState();
  const isOperational = order.orderStatus === ORDER_STATUS.confirmed;

  if (!canUpdate) {
    return (
      <span
        className={`inline-flex min-w-48 items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold ${
          financialStatusClass[order.financialStatus]
        }`}
      >
        {order.financialStatus}
      </span>
    );
  }

  async function updateFinancialStatus(
    status: PurchaseOrderFinancialStatus,
    reserveStock: boolean,
  ) {
    setIsLoading(true);
    try {
      const financialResult = await updatePurchaseOrderFinancialStatus(
        order.id,
        status,
      );

      if (!financialResult.success) {
        toast(financialResult.error);
        return;
      }

      onUpdated(financialResult.order);

      if (reserveStock) {
        const stockResult = await updatePurchaseOrderStockStatus(
          order.id,
          STOCK_STATUS.reserved,
        );

        if (!stockResult.success) {
          toast(stockResult.error);
          return;
        }

        onUpdated(stockResult.order);
      }

      toast("Status financeiro atualizado.");
    } finally {
      setIsLoading(false);
      paymentConfirmState.close();
      reservePromptState.close();
    }
  }

  function confirmPaidStatusChange() {
    const shouldAskToReserve = order.stockStatus !== STOCK_STATUS.reserved;

    paymentConfirmState.close();

    if (shouldAskToReserve) {
      reservePromptState.open();
      return;
    }

    void updateFinancialStatus(pendingStatus, false);
  }

  function handleChange(status: PurchaseOrderFinancialStatus) {
    if (status === order.financialStatus) return;

    if (STATUSES_REQUIRING_CONFIRMATION.includes(status)) {
      setPendingStatus(status);
      paymentConfirmState.open();
      return;
    }

    void updateFinancialStatus(status, false);
  }

  return (
    <>
      <Select
        aria-label={`Status financeiro do pedido #${order.number}`}
        isDisabled={!isOperational || isLoading}
        onSelectionChange={(key) => {
          const status = key?.toString() as PurchaseOrderFinancialStatus;
          if (FINANCIAL_STATUSES.includes(status)) handleChange(status);
        }}
        selectedKey={order.financialStatus}
        variant="secondary"
      >
        <Label className="sr-only">Pagamento</Label>
        <Select.Trigger
          className={`min-w-48 border font-semibold ${
            financialStatusClass[order.financialStatus]
          }`}
        >
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {FINANCIAL_STATUSES.map((status) => (
              <ListBox.Item id={status} key={status} textValue={status}>
                {status}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <ConfirmPaymentStatusModal
        isLoading={isLoading}
        onConfirm={confirmPaidStatusChange}
        orderNumber={order.number}
        state={paymentConfirmState}
        statusLabel={pendingStatus}
      />

      <ReserveStockPromptModal
        isLoading={isLoading}
        onConfirm={() => {
          void updateFinancialStatus(pendingStatus, true);
        }}
        onDecline={() => {
          void updateFinancialStatus(pendingStatus, false);
        }}
        orderNumber={order.number}
        state={reservePromptState}
      />
    </>
  );
}
