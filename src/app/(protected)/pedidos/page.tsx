"use client";

import type { Selection, SortDescriptor } from "@heroui/react";
import {
  Button,
  buttonVariants,
  DateField,
  DateRangePicker,
  Drawer,
  Dropdown,
  Label,
  ListBox,
  Modal,
  Pagination,
  RangeCalendar,
  SearchField,
  Select,
  Table,
  Toast,
  toast,
  useOverlayState,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SendEmailModal } from "@/components/purchase-order/SendEmailModal";
import { FinancialStatusControl } from "@/components/purchase-order/status-controls/FinancialStatusControl";
import { OrderStatusControl } from "@/components/purchase-order/status-controls/OrderStatusControl";
import { StockStatusControl } from "@/components/purchase-order/status-controls/StockStatusControl";
import { TableSkeleton } from "@/components/ui/loading";
import { FilterBar, PageHeader, PageShell } from "@/components/ui/page";
import { ORDER_STATUSES } from "@/lib/purchase-orders/constants";
import { useHasPermission } from "@/lib/rbac/permission-context";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import type { PurchaseOrderSummary } from "./types";

type DateRange = { start: DateValue; end: DateValue };
type OrderStatusFilterValue = "Todos" | (typeof ORDER_STATUSES)[number];

const DEFAULT_ORDER_STATUS_FILTER = new Set<OrderStatusFilterValue>([
  "Orçamento",
  "Confirmado",
]);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);

const formatWeight = (value: number) =>
  `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    style: "decimal",
  }).format(value)} kg`;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
};

const formatDateTime = (dateString: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateString));

const BOX_TYPE_LABEL: Record<string, string> = {
  FULL: "22.68kg (Completa)",
  HALF: "11.34kg (Meia)",
};

const formatOrderStatusFilterLabel = (
  selectedStatuses: Set<OrderStatusFilterValue>,
) => {
  if (selectedStatuses.has("Todos")) {
    return "Todos";
  }

  if (selectedStatuses.size === 0) {
    return "Nenhum";
  }

  return Array.from(selectedStatuses).join(", ");
};

function SortableColumnHeader({
  children,
  sortDirection,
}: {
  children: React.ReactNode;
  sortDirection?: "ascending" | "descending";
}) {
  return (
    <span className="flex items-center justify-between gap-2">
      {children}
      {sortDirection && (
        <svg
          aria-hidden="true"
          className={`size-3 shrink-0 transition-transform ${
            sortDirection === "descending" ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            d="M5 15l7-7 7 7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function ExpandedOrderItems({ order }: { order: PurchaseOrderSummary }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <table className="w-full text-xs">
        <tbody>
          {Array.from({ length: order.items.length || 2 }, (_, i) => (
            <tr key={i} className="border-b border-border/30 last:border-0">
              <td className="py-2.5 pr-4 w-1/3">
                <div className="kaju-skeleton h-3 w-40 rounded" />
              </td>
              <td className="py-2.5 pr-4">
                <div className="kaju-skeleton h-3 w-32 rounded" />
              </td>
              <td className="py-2.5 text-center">
                <div className="kaju-skeleton h-3 w-8 rounded mx-auto" />
              </td>
              <td className="py-2.5 text-right">
                <div className="kaju-skeleton h-3 w-16 rounded ml-auto" />
              </td>
              <td className="py-2.5 text-right">
                <div className="kaju-skeleton h-3 w-16 rounded ml-auto" />
              </td>
              <td className="py-2.5 text-right">
                <div className="kaju-skeleton h-3 w-20 rounded ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (order.items.length === 0) {
    return <p className="text-xs text-muted py-2">Nenhum item neste pedido.</p>;
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border/50">
          <th className="pb-2 text-left font-semibold uppercase tracking-wide text-muted w-1/3">
            Produto
          </th>
          <th className="pb-2 text-left font-semibold uppercase tracking-wide text-muted">
            Tipo
          </th>
          <th className="pb-2 text-center font-semibold uppercase tracking-wide text-muted">
            Qtd (cx)
          </th>
          <th className="pb-2 text-right font-semibold uppercase tracking-wide text-muted">
            Preço/kg
          </th>
          <th className="pb-2 text-right font-semibold uppercase tracking-wide text-muted">
            Peso total
          </th>
          <th className="pb-2 text-right font-semibold uppercase tracking-wide text-muted">
            Valor
          </th>
        </tr>
      </thead>
      <tbody>
        {order.items.map((item) => (
          <tr key={item.id} className="border-b border-border/30 last:border-0">
            <td className="py-2 pr-4 font-medium text-foreground">
              {item.productName ?? `Produto #${item.productId}`}
            </td>
            <td className="py-2 pr-4 text-muted">
              {BOX_TYPE_LABEL[item.boxType] ?? item.boxType}
            </td>
            <td className="py-2 text-center tabular-nums">{item.quantity}</td>
            <td className="py-2 text-right tabular-nums">
              {formatCurrency(item.pricePerKg)}
            </td>
            <td className="py-2 text-right tabular-nums">
              {formatWeight(item.totalWeight)}
            </td>
            <td className="py-2 text-right tabular-nums font-semibold">
              {formatCurrency(item.totalPrice)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PurchaseOrderListPage() {
  const canSaveOrders = useHasPermission(PERMISSIONS.ORDERS_SAVE);
  const canEmailOrders = useHasPermission(PERMISSIONS.ORDERS_SEND_EMAIL);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    Set<OrderStatusFilterValue>
  >(DEFAULT_ORDER_STATUS_FILTER);
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const queryClient = useQueryClient();
  const {
    data: orders = [],
    isPending: isLoadingOrders,
    error,
  } = useQuery<PurchaseOrderSummary[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await fetch("/api/purchase-orders");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Erro ao carregar pedidos.");
      }
      return res.json();
    },
  });
  const loadError = error instanceof Error ? error.message : null;

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "date",
    direction: "descending",
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null);
  const [exportingImageId, setExportingImageId] = useState<string | null>(null);
  const emailModalState = useOverlayState();
  const [selectedEmailOrder, setSelectedEmailOrder] =
    useState<PurchaseOrderSummary | null>(null);

  async function handleExportPDF(order: PurchaseOrderSummary) {
    setExportingPdfId(order.id);
    try {
      const res = await fetch(`/api/purchase-orders/${order.id}`);
      if (!res.ok) throw new Error("Erro ao carregar pedido.");
      const fullOrder = await res.json();

      const itemsWithNames = (
        fullOrder.items as Array<{
          id: string;
          productId: number;
          productName?: string | null;
          boxType: string;
          quantity: number;
          customPricePerKg: number;
          boxWeightKg: number;
          totalWeight: number;
          totalPrice: number;
        }>
      ).map((item) => {
        const summaryItem = order.items.find((si) => si.id === item.id);
        return {
          ...item,
          productName: summaryItem?.productName ?? item.productName ?? null,
        };
      });

      const { pdf } = await import("@react-pdf/renderer");
      const { PurchaseOrderDocument } = await import(
        "@/components/purchase-order/PurchaseOrderPDF"
      );

      const blob = await pdf(
        <PurchaseOrderDocument
          data={{
            ...fullOrder,
            items: itemsWithNames,
            generatedAt: new Date().toISOString(),
          }}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedido-${order.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExportingPdfId(null);
    }
  }

  async function handleCopyEmailImage(order: PurchaseOrderSummary) {
    setExportingImageId(order.id);
    try {
      const res = await fetch(`/api/purchase-orders/${order.id}`);
      if (!res.ok) throw new Error("Erro ao carregar pedido.");
      const fullOrder = await res.json();

      const itemsWithNames = (
        fullOrder.items as Array<{
          id: string;
          productId: number;
          productName?: string | null;
          boxType: string;
          quantity: number;
          customPricePerKg: number;
          boxWeightKg: number;
          totalWeight: number;
          totalPrice: number;
        }>
      ).map((item) => {
        const summaryItem = order.items.find((si) => si.id === item.id);
        return {
          ...item,
          productName: summaryItem?.productName ?? item.productName ?? null,
        };
      });

      const { toBlob } = await import("html-to-image");
      const { PurchaseOrderEmailImage } = await import(
        "@/components/purchase-order/PurchaseOrderEmailImage"
      );
      const { createRoot } = await import("react-dom/client");
      const { flushSync } = await import("react-dom");
      const { createElement } = await import("react");

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      document.body.appendChild(container);

      const root = createRoot(container);
      flushSync(() => {
        root.render(
          createElement(PurchaseOrderEmailImage, {
            data: {
              ...fullOrder,
              items: itemsWithNames,
              generatedAt: new Date().toISOString(),
            },
          }),
        );
      });

      const blob = await toBlob(container.firstElementChild as HTMLElement, {
        pixelRatio: 2,
      });

      root.unmount();
      document.body.removeChild(container);

      if (!blob) throw new Error("Falha ao gerar imagem.");

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedido-${order.number}.png`;
      a.click();
      URL.revokeObjectURL(url);

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast("Imagem copiada e salva! Cole no e-mail com Ctrl+V.");
    } catch (err) {
      console.error(err);
      toast("Erro ao gerar imagem.");
    } finally {
      setExportingImageId(null);
    }
  }

  function handleRowPress(orderId: string) {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  }

  function handleOrderUpdated(updatedOrder: PurchaseOrderSummary) {
    queryClient.setQueryData<PurchaseOrderSummary[]>(
      ["purchase-orders"],
      (current) =>
        current?.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order,
        ) ?? [],
    );
  }

  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          order.clientName.toLowerCase().includes(lowerQuery) ||
          order.id.includes(lowerQuery) ||
          String(order.number).includes(lowerQuery),
      );
    }

    if (!orderStatusFilter.has("Todos")) {
      result = result.filter((order) =>
        orderStatusFilter.has(order.orderStatus),
      );
    }

    if (dateFilter) {
      const startStr = dateFilter.start.toString();
      const endStr = dateFilter.end.toString();
      result = result.filter(
        (order) => order.date >= startStr && order.date <= endStr,
      );
    }

    result.sort((a, b) => {
      const first = a[sortDescriptor.column as keyof PurchaseOrderSummary];
      const second = b[sortDescriptor.column as keyof PurchaseOrderSummary];
      let comparison = 0;

      if (first < second) comparison = -1;
      if (first > second) comparison = 1;

      return sortDescriptor.direction === "descending"
        ? -comparison
        : comparison;
    });

    return result;
  }, [orders, searchQuery, orderStatusFilter, dateFilter, sortDescriptor]);

  const totalPages =
    Math.ceil(filteredAndSortedOrders.length / rowsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredAndSortedOrders.slice(start, start + rowsPerPage);
  }, [filteredAndSortedOrders, page, rowsPerPage]);

  const displayRows = useMemo(() => {
    return paginatedOrders.flatMap((order) => {
      const rows: Array<{
        id: string;
        kind: "order" | "detail";
        data: PurchaseOrderSummary;
      }> = [{ id: order.id, kind: "order", data: order }];
      if (expandedOrderId === order.id) {
        rows.push({ id: `${order.id}-detail`, kind: "detail", data: order });
      }
      return rows;
    });
  }, [paginatedOrders, expandedOrderId]);

  const selectedAuditOrder = selectedAuditId
    ? orders.find((order) => order.id === selectedAuditId)
    : null;
  const currentAuditLogs = selectedAuditOrder?.audits ?? [];
  const startItem =
    filteredAndSortedOrders.length > 0 ? (page - 1) * rowsPerPage + 1 : 0;
  const endItem = Math.min(page * rowsPerPage, filteredAndSortedOrders.length);
  const availableOrderStatuses: OrderStatusFilterValue[] = [
    "Todos",
    ...ORDER_STATUSES,
  ];

  const handleOrderStatusFilterChange = (selection: Selection) => {
    if (selection === "all") {
      setOrderStatusFilter(new Set(["Todos"]));
      setPage(1);
      return;
    }

    const selectedStatuses = new Set(
      Array.from(selection, String) as OrderStatusFilterValue[],
    );

    if (selectedStatuses.has("Todos") && selectedStatuses.size > 1) {
      if (orderStatusFilter.has("Todos")) {
        selectedStatuses.delete("Todos");
      } else {
        setOrderStatusFilter(new Set(["Todos"]));
        setPage(1);
        return;
      }
    }

    if (selectedStatuses.has("Todos")) {
      setOrderStatusFilter(new Set(["Todos"]));
      setPage(1);
      return;
    }

    setOrderStatusFilter(selectedStatuses);
    setPage(1);
  };

  return (
    <>
      <Toast.Provider placement="top end" />

      <PageShell>
        <PageHeader
          description="Gerencie pedidos, pagamentos, reservas e auditoria em uma visão operacional."
          eyebrow="Comercial"
          title="Pedidos de compra"
          actions={
            canSaveOrders ? (
              <Link
                className={buttonVariants({ variant: "primary" })}
                href="/pedidos/novo"
              >
                + Novo Pedido
              </Link>
            ) : undefined
          }
        />

        <FilterBar className="flex flex-wrap items-end gap-4">
          <SearchField
            className="w-full flex-1 sm:min-w-[240px]"
            name="search"
            onChange={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
            value={searchQuery}
            variant="secondary"
          >
            <Label className="mb-1 block text-sm font-medium">Buscar</Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Buscar cliente ou nº..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <DateRangePicker
            className="w-full sm:w-[280px]"
            onChange={(value) => {
              setDateFilter(value);
              setPage(1);
            }}
            value={dateFilter}
          >
            <Label className="mb-1 block text-sm font-medium">Período</Label>
            <DateField.Group fullWidth variant="secondary">
              <DateField.InputContainer>
                <DateField.Input slot="start">
                  {(segment) => <DateField.Segment segment={segment} />}
                </DateField.Input>
                <DateRangePicker.RangeSeparator />
                <DateField.Input slot="end">
                  {(segment) => <DateField.Segment segment={segment} />}
                </DateField.Input>
              </DateField.InputContainer>
              <DateField.Suffix>
                {dateFilter && (
                  <button
                    aria-label="Limpar data"
                    className="mr-1 text-muted hover:text-foreground"
                    onClick={() => setDateFilter(null)}
                    type="button"
                  >
                    <svg
                      aria-hidden="true"
                      className="size-4"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path
                        clipRule="evenodd"
                        d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14M6.53 5.47a.75.75 0 0 0-1.06 1.06L6.94 8L5.47 9.47a.75.75 0 1 0 1.06 1.06L8 9.06l1.47 1.47a.75.75 0 1 0 1.06-1.06L9.06 8l1.47-1.47a.75.75 0 1 0-1.06-1.06L8 6.94z"
                        fillRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
                <DateRangePicker.Trigger>
                  <DateRangePicker.TriggerIndicator />
                </DateRangePicker.Trigger>
              </DateField.Suffix>
            </DateField.Group>
            <DateRangePicker.Popover>
              <RangeCalendar aria-label="Escolher datas">
                <RangeCalendar.Header>
                  <RangeCalendar.YearPickerTrigger>
                    <RangeCalendar.YearPickerTriggerHeading />
                    <RangeCalendar.YearPickerTriggerIndicator />
                  </RangeCalendar.YearPickerTrigger>
                  <RangeCalendar.NavButton slot="previous" />
                  <RangeCalendar.NavButton slot="next" />
                </RangeCalendar.Header>
                <RangeCalendar.Grid>
                  <RangeCalendar.GridHeader>
                    {(day) => (
                      <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
                    )}
                  </RangeCalendar.GridHeader>
                  <RangeCalendar.GridBody>
                    {(date) => <RangeCalendar.Cell date={date} />}
                  </RangeCalendar.GridBody>
                </RangeCalendar.Grid>
                <RangeCalendar.YearPickerGrid>
                  <RangeCalendar.YearPickerGridBody>
                    {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
                  </RangeCalendar.YearPickerGridBody>
                </RangeCalendar.YearPickerGrid>
              </RangeCalendar>
            </DateRangePicker.Popover>
          </DateRangePicker>

          <div className="w-full sm:w-[240px]">
            <Label className="mb-1 block text-sm font-medium">Pedido</Label>
            <Dropdown>
              <Button className="w-full justify-start" variant="secondary">
                {formatOrderStatusFilterLabel(orderStatusFilter)}
              </Button>
              <Dropdown.Popover className="w-[240px]">
                <ListBox
                  aria-label="Filtrar por status do pedido"
                  onSelectionChange={handleOrderStatusFilterChange}
                  selectedKeys={orderStatusFilter}
                  selectionMode="multiple"
                >
                  {availableOrderStatuses.map((status) => (
                    <ListBox.Item id={status} key={status} textValue={status}>
                      {status}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </FilterBar>

        {isLoadingOrders ? (
          <TableSkeleton columns={9} rows={6} />
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Tabela de Pedidos de Compra"
                className="min-w-[1120px]"
                onSortChange={setSortDescriptor}
                sortDescriptor={sortDescriptor}
                onRowAction={(key) => {
                  const id = String(key);
                  if (!id.endsWith("-detail")) {
                    handleRowPress(id);
                  }
                }}
              >
                <Table.Header>
                  <Table.Column allowsSorting id="number" isRowHeader>
                    {({ sortDirection }) => (
                      <SortableColumnHeader sortDirection={sortDirection}>
                        Nº
                      </SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column allowsSorting id="date">
                    {({ sortDirection }) => (
                      <SortableColumnHeader sortDirection={sortDirection}>
                        DATA
                      </SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column allowsSorting id="clientName">
                    {({ sortDirection }) => (
                      <SortableColumnHeader sortDirection={sortDirection}>
                        CLIENTE
                      </SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column allowsSorting id="orderStatus">
                    {({ sortDirection }) => (
                      <SortableColumnHeader sortDirection={sortDirection}>
                        PEDIDO
                      </SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column allowsSorting id="financialStatus">
                    {({ sortDirection }) => (
                      <SortableColumnHeader sortDirection={sortDirection}>
                        PAGAMENTO
                      </SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column allowsSorting id="stockStatus">
                    {({ sortDirection }) => (
                      <SortableColumnHeader sortDirection={sortDirection}>
                        ESTOQUE
                      </SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column
                    allowsSorting
                    className="text-center"
                    id="boxes"
                  >
                    {({ sortDirection }) => (
                      <SortableColumnHeader sortDirection={sortDirection}>
                        CAIXAS
                      </SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column
                    allowsSorting
                    className="text-right"
                    id="totalWeightKg"
                  >
                    {({ sortDirection }) => (
                      <SortableColumnHeader sortDirection={sortDirection}>
                        PESO TOTAL
                      </SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column
                    allowsSorting
                    className="text-right"
                    id="totalPrice"
                  >
                    {({ sortDirection }) => (
                      <SortableColumnHeader sortDirection={sortDirection}>
                        VALOR TOTAL
                      </SortableColumnHeader>
                    )}
                  </Table.Column>
                  <Table.Column className="text-center" id="actions">
                    AÇÕES
                  </Table.Column>
                </Table.Header>

                <Table.Body
                  items={displayRows}
                  renderEmptyState={() => (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted">
                      <svg
                        aria-hidden="true"
                        className="mb-4 size-10 opacity-20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                      {loadError ??
                        "Nenhum pedido encontrado com os filtros atuais."}
                    </div>
                  )}
                >
                  {(row) => {
                    if (row.kind === "detail") {
                      const { data: order } = row;
                      return (
                        <Table.Row id={row.id}>
                          <Table.Cell
                            colSpan={10}
                            className="p-0 bg-surface-secondary/40 border-b border-border"
                          >
                            <div className="px-6 py-4">
                              <ExpandedOrderItems order={order} />
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      );
                    }

                    const { data: order } = row;
                    const isExpanded = expandedOrderId === order.id;

                    return (
                      <Table.Row id={row.id} className="cursor-pointer">
                        <Table.Cell className="font-medium">
                          <span className="flex items-center gap-2">
                            <svg
                              aria-hidden="true"
                              className={`size-3 shrink-0 text-muted transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.5}
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M9 5l7 7-7 7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            #{order.number}
                          </span>
                        </Table.Cell>
                        <Table.Cell>{formatDate(order.date)}</Table.Cell>
                        <Table.Cell>{order.clientName}</Table.Cell>
                        <Table.Cell>
                          <OrderStatusControl
                            onUpdated={handleOrderUpdated}
                            order={order}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <FinancialStatusControl
                            onUpdated={handleOrderUpdated}
                            order={order}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <StockStatusControl
                            onUpdated={handleOrderUpdated}
                            order={order}
                          />
                        </Table.Cell>
                        <Table.Cell>{order.boxes}</Table.Cell>
                        <Table.Cell>
                          {formatWeight(order.totalWeightKg)}
                        </Table.Cell>
                        <Table.Cell>
                          {formatCurrency(order.totalPrice)}
                        </Table.Cell>
                        <Table.Cell>
                          <div
                            className="flex justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Dropdown>
                              <Button
                                aria-label="Ações"
                                isIconOnly
                                size="sm"
                                variant="ghost"
                              >
                                {exportingPdfId === order.id ? (
                                  <svg
                                    aria-hidden="true"
                                    className="size-4 animate-spin"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    aria-hidden="true"
                                    className="size-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                    />
                                  </svg>
                                )}
                              </Button>
                              <Dropdown.Popover>
                                <Dropdown.Menu
                                  aria-label="Opções do pedido"
                                  onAction={(key) => {
                                    if (key === "audit") {
                                      setSelectedAuditId(order.id);
                                      setIsAuditOpen(true);
                                    }
                                    if (key === "pdf") {
                                      void handleExportPDF(order);
                                    }
                                    if (key === "image") {
                                      void handleCopyEmailImage(order);
                                    }
                                    if (key === "email") {
                                      setSelectedEmailOrder(order);
                                      emailModalState.open();
                                    }
                                  }}
                                >
                                  {canSaveOrders && (
                                    <Dropdown.Item id="edit" textValue="Editar">
                                      <Link
                                        className="flex w-full items-center"
                                        href={`/pedidos/novo?id=${order.id}`}
                                      >
                                        <Label className="cursor-pointer">
                                          Visualizar / Editar
                                        </Label>
                                      </Link>
                                    </Dropdown.Item>
                                  )}
                                  <Dropdown.Item
                                    id="pdf"
                                    textValue="Exportar PDF"
                                    isDisabled={exportingPdfId === order.id}
                                  >
                                    <Label className="cursor-pointer">
                                      {exportingPdfId === order.id
                                        ? "Gerando PDF…"
                                        : "Exportar PDF"}
                                    </Label>
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    id="image"
                                    textValue="Copiar imagem para e-mail"
                                    isDisabled={exportingImageId === order.id}
                                  >
                                    <Label className="cursor-pointer">
                                      {exportingImageId === order.id
                                        ? "Gerando imagem…"
                                        : "Copiar imagem para e-mail"}
                                    </Label>
                                  </Dropdown.Item>
                                  {canEmailOrders && (
                                    <Dropdown.Item
                                      id="email"
                                      textValue="Enviar por e-mail"
                                    >
                                      <Label className="cursor-pointer">
                                        Enviar por e-mail
                                      </Label>
                                    </Dropdown.Item>
                                  )}
                                  <Dropdown.Item
                                    id="audit"
                                    textValue="Auditoria"
                                  >
                                    <Label className="cursor-pointer">
                                      Auditoria
                                    </Label>
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown.Popover>
                            </Dropdown>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    );
                  }}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {filteredAndSortedOrders.length > 0 && (
              <Table.Footer className="flex w-full items-center justify-between border-t border-border bg-surface-secondary/50 px-4 py-3">
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-sm text-muted">Exibir:</span>
                  <Select
                    aria-label="Itens por página"
                    className="w-20"
                    onChange={(value) => {
                      setRowsPerPage(Number(value));
                      setPage(1);
                    }}
                    value={rowsPerPage.toString()}
                    variant="secondary"
                  >
                    <Select.Trigger className="h-8 min-h-8 py-0">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {[3, 5, 10, 20].map((count) => (
                          <ListBox.Item
                            id={String(count)}
                            key={count}
                            textValue={String(count)}
                          >
                            {count}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <Pagination className="w-full sm:w-auto">
                  <Pagination.Summary className="hidden md:block">
                    Mostrando {startItem} a {endItem} de{" "}
                    {filteredAndSortedOrders.length}
                  </Pagination.Summary>
                  <Pagination.Content className="sm:ml-auto">
                    <Pagination.Item>
                      <Pagination.Previous
                        isDisabled={page === 1}
                        onPress={() =>
                          setPage((current) => Math.max(1, current - 1))
                        }
                      >
                        <Pagination.PreviousIcon />
                        <span className="hidden sm:inline">Anterior</span>
                      </Pagination.Previous>
                    </Pagination.Item>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1,
                    ).map((pageNumber) => (
                      <Pagination.Item key={pageNumber}>
                        <Pagination.Link
                          isActive={pageNumber === page}
                          onPress={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Link>
                      </Pagination.Item>
                    ))}

                    <Pagination.Item>
                      <Pagination.Next
                        isDisabled={page === totalPages}
                        onPress={() =>
                          setPage((current) =>
                            Math.min(totalPages, current + 1),
                          )
                        }
                      >
                        <span className="hidden sm:inline">Próximo</span>
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </Table.Footer>
            )}
          </Table>
        )}

        <SendEmailModal order={selectedEmailOrder} state={emailModalState} />

        <Drawer>
          <button className="hidden" type="button" />
          <Drawer.Backdrop isOpen={isAuditOpen} onOpenChange={setIsAuditOpen}>
            <Drawer.Content placement="right">
              <Drawer.Dialog className="sm:max-w-md">
                <Drawer.CloseTrigger />
                <Drawer.Header>
                  <Drawer.Heading>
                    Histórico do Pedido #{selectedAuditOrder?.number}
                  </Drawer.Heading>
                </Drawer.Header>
                <Drawer.Body className="p-6">
                  {currentAuditLogs.length === 0 ? (
                    <p className="text-center text-muted">
                      Nenhum histórico encontrado para este pedido.
                    </p>
                  ) : (
                    <div className="relative ml-3 space-y-8 border-l border-separator">
                      {currentAuditLogs.map((log) => (
                        <div className="relative pl-6" key={log.id}>
                          <div className="absolute -left-1.5 mt-1.5 size-3 rounded-full bg-accent ring-4 ring-surface" />
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-accent">
                              {formatDateTime(log.date)}
                            </span>
                            <span className="font-medium text-foreground">
                              {log.action}
                            </span>
                            <span className="text-sm text-muted">
                              Por: {log.user}
                            </span>
                            <div className="mt-2 rounded-lg bg-surface-secondary p-3 text-sm text-foreground">
                              {log.details}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Drawer.Body>
                <Drawer.Footer>
                  <Button className="w-full" slot="close" variant="secondary">
                    Fechar
                  </Button>
                </Drawer.Footer>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      </PageShell>
    </>
  );
}
