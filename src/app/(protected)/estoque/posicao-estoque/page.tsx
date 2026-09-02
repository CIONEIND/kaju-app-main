"use client";

import {
  Button,
  Checkbox,
  Label,
  Modal,
  SearchField,
  toast,
  useOverlayState,
} from "@heroui/react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { ProductReservation } from "@/app/services/product/productService";
import {
  getProductReservations,
  getSockPositionWithReservations,
} from "@/app/services/product/productService";
import type { VirtualStock } from "@/app/services/product/types";
import { SendStockReportModal } from "@/components/stock/SendStockReportModal";
import type { StockPositionPDFData } from "@/components/stock/StockPositionPDF";
import { TableSkeleton } from "@/components/ui/loading";
import { FilterBar, PageHeader, PageShell } from "@/components/ui/page";
import {
  computeGrandTotals,
  formatQuantity,
  groupStock,
} from "@/lib/stock/grouping";

// --- Chevron icon ---
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`size-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// --- Totals cells (reused in collapsed headers) ---
function TotalCells({
  totals,
}: {
  totals: { physicalStock: number; reserved: number; available: number };
}) {
  return (
    <>
      <td className="px-4 py-2 text-center text-xs font-semibold tabular-nums text-foreground/70">
        {formatQuantity(totals.physicalStock)}
      </td>
      <td className="px-4 py-2 text-center">
        <span className="inline-flex min-w-16 justify-center rounded-md border border-amber-200/60 bg-amber-50/60 px-2 py-0.5 text-xs font-semibold text-amber-700">
          {formatQuantity(totals.reserved)}
        </span>
      </td>
      <td className="px-4 py-2 text-center">
        <span
          className={`inline-flex min-w-16 justify-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
            totals.available < 0
              ? "border-red-200/60 bg-red-50/60 text-red-600"
              : "border-emerald-200/60 bg-emerald-50/60 text-emerald-600"
          }`}
        >
          {formatQuantity(totals.available)}
        </span>
      </td>
    </>
  );
}

// --- Main Component ---
export default function StockPositionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stockItems, setStockItems] = useState<VirtualStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [onlyInStock, setOnlyInStock] = useState(true);

  // Report export / email
  const emailModalState = useOverlayState();
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Reservation drill-down modal
  const reservationModalState = useOverlayState();
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [reservations, setReservations] = useState<ProductReservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);

  async function openReservations(productId: number, productName: string) {
    setSelectedProduct({ id: productId, name: productName });
    setReservations([]);
    reservationModalState.open();
    setIsLoadingReservations(true);
    try {
      const data = await getProductReservations(productId);
      setReservations(data);
    } finally {
      setIsLoadingReservations(false);
    }
  }

  // Collapse state: Set of collapsed keys
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedSubCategories, setCollapsedSubCategories] = useState<
    Set<string>
  >(new Set());

  function toggleCategory(cat: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleSubCategory(key: string) {
    setCollapsedSubCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  useEffect(() => {
    let isActive = true;

    async function loadStock() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const payload = await getSockPositionWithReservations();
        if (isActive) setStockItems(payload);
      } catch (error) {
        if (isActive) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Erro ao carregar estoque.",
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadStock();
    return () => {
      isActive = false;
    };
  }, []);

  const grouped = useMemo(() => {
    let result = [...stockItems];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }

    if (onlyInStock) {
      result = result.filter((item) => item.available > 0);
    }

    return groupStock(result);
  }, [stockItems, searchQuery, onlyInStock]);

  const totalItems = useMemo(
    () =>
      grouped.reduce(
        (acc, cat) =>
          acc + cat.subCategories.reduce((a, s) => a + s.items.length, 0),
        0,
      ),
    [grouped],
  );

  // Report data shared by "Exportar PDF" and the e-mail modal — reflects the
  // filters currently applied on screen. `generatedAt` is refreshed at the
  // moment the PDF is actually generated.
  const reportData = useMemo<StockPositionPDFData>(
    () => ({
      groups: grouped,
      grandTotals: computeGrandTotals(grouped),
      productCount: totalItems,
      onlyAvailable: onlyInStock,
      searchQuery,
      generatedAt: new Date().toISOString(),
    }),
    [grouped, totalItems, onlyInStock, searchQuery],
  );

  async function handleExportPDF() {
    if (totalItems === 0) return;
    setIsExportingPdf(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { StockPositionDocument } = await import(
        "@/components/stock/StockPositionPDF"
      );

      const blob = await pdf(
        <StockPositionDocument
          data={{ ...reportData, generatedAt: new Date().toISOString() }}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `posicao-estoque-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast("Erro ao gerar PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  }

  const actionsDisabled = isLoading || totalItems === 0;

  return (
    <PageShell>
      <PageHeader
        description="Visualize disponibilidade, reservas e saldo operacional dos produtos."
        eyebrow="Operações"
        title="Posição de estoque"
        actions={
          <>
            <Button
              isDisabled={actionsDisabled || isExportingPdf}
              onPress={handleExportPDF}
              variant="secondary"
            >
              {isExportingPdf ? "Gerando PDF…" : "Exportar PDF"}
            </Button>
            <Button
              isDisabled={actionsDisabled}
              onPress={() => emailModalState.open()}
              variant="primary"
            >
              Enviar por e-mail
            </Button>
          </>
        }
      />

      <FilterBar className="flex flex-wrap items-end gap-4">
        <SearchField
          className="w-full flex-1 sm:min-w-[240px]"
          name="search"
          value={searchQuery}
          onChange={setSearchQuery}
          variant="secondary"
        >
          <Label className="mb-1 block text-sm font-medium">
            Buscar Produto
          </Label>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Buscar por nome do produto..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <div className="flex items-center h-10 pb-1">
          <Checkbox
            id="show-only-available"
            isSelected={onlyInStock}
            onChange={setOnlyInStock}
          >
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>
              <Label htmlFor="show-only-available">
                Exibir apenas produtos disponíveis
              </Label>
            </Checkbox.Content>
          </Checkbox>
        </div>
      </FilterBar>

      {isLoading ? (
        <TableSkeleton columns={4} rows={8} />
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted">
          <p className="text-sm">
            Erro ao carregar estoque. Consulte o administrador do sistema.
          </p>
        </div>
      ) : totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted">
          <svg
            aria-hidden="true"
            className="mb-4 size-10 opacity-20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-sm">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-muted">
                  NOME DO PRODUTO
                </th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide text-muted">
                  ESTOQUE FÍSICO
                </th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide text-muted">
                  RESERVADO
                </th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide text-muted">
                  DISPONÍVEL
                </th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((cat) => {
                const catCollapsed = collapsedCategories.has(cat.categoria);

                return (
                  <Fragment key={cat.categoria}>
                    {/* Category header */}
                    <tr className="bg-accent/10 border-t border-border">
                      <td
                        colSpan={catCollapsed ? 1 : 4}
                        className="px-4 py-2 font-bold text-accent text-xs uppercase tracking-wider"
                      >
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat.categoria)}
                          className="flex items-center gap-2 w-full text-left hover:opacity-75 transition-opacity"
                          aria-expanded={!catCollapsed}
                        >
                          <Chevron open={!catCollapsed} />
                          {cat.categoria}
                        </button>
                      </td>
                      {catCollapsed && <TotalCells totals={cat.totals} />}
                    </tr>

                    {/* Subcategories */}
                    {!catCollapsed &&
                      cat.subCategories.map((sub) => {
                        const subKey = `${cat.categoria}::${sub.subCategoria}`;
                        const subCollapsed = collapsedSubCategories.has(subKey);

                        return (
                          <Fragment key={sub.subCategoria}>
                            {/* Subcategory header */}
                            <tr className="bg-surface-secondary border-t border-border/50">
                              <td
                                colSpan={subCollapsed ? 1 : 4}
                                className="px-6 py-1.5 text-xs font-semibold text-muted uppercase tracking-wide"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleSubCategory(subKey)}
                                  className="flex items-center gap-2 w-full text-left hover:opacity-75 transition-opacity"
                                  aria-expanded={!subCollapsed}
                                >
                                  <Chevron open={!subCollapsed} />
                                  {sub.subCategoria}
                                  <span className="ml-1 font-normal normal-case opacity-60">
                                    ({sub.items.length})
                                  </span>
                                </button>
                              </td>
                              {subCollapsed && (
                                <TotalCells totals={sub.totals} />
                              )}
                            </tr>

                            {/* Items */}
                            {!subCollapsed &&
                              sub.items.map((item) => (
                                <tr
                                  key={item.id}
                                  className="border-t border-border/30 hover:bg-surface-secondary/40 transition-colors"
                                >
                                  <td className="px-4 py-2.5 pl-10 font-medium text-foreground">
                                    {item.name}
                                  </td>
                                  <td className="px-4 py-2.5 text-center tabular-nums text-foreground/80">
                                    {formatQuantity(item.physicalStock)}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    {item.reserved > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openReservations(item.id, item.name)
                                        }
                                        className="inline-flex min-w-16 justify-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 underline-offset-2 hover:bg-amber-100 hover:underline transition-colors cursor-pointer"
                                      >
                                        {formatQuantity(item.reserved)}
                                      </button>
                                    ) : (
                                      <span className="inline-flex min-w-16 justify-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                        {formatQuantity(item.reserved)}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span
                                      className={`inline-flex min-w-16 justify-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
                                        item.available < 0
                                          ? "border-red-200 bg-red-50 text-red-700"
                                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      }`}
                                    >
                                      {formatQuantity(item.available)}
                                    </span>
                                  </td>
                                </tr>
                              ))}

                            {/* Subcategory totals — only when expanded */}
                            {!subCollapsed && (
                              <tr className="border-t border-border/50 bg-surface-secondary/30">
                                <td className="px-4 py-2 pl-10 text-xs font-semibold text-muted italic">
                                  Subtotal — {sub.items.length} produto
                                  {sub.items.length !== 1 ? "s" : ""}
                                </td>
                                <TotalCells totals={sub.totals} />
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-border bg-surface-secondary/50 px-4 py-3">
            <p className="text-xs text-muted">
              {totalItems} produto{totalItems !== 1 ? "s" : ""} em{" "}
              {grouped.length} categoria{grouped.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
      <Modal state={reservationModalState}>
        <Modal.Backdrop variant="blur">
          <Modal.Container size="lg">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Pedidos com reserva de estoque</Modal.Heading>
                {selectedProduct && (
                  <p className="mt-1 text-sm text-muted">
                    {selectedProduct.name}
                  </p>
                )}
              </Modal.Header>

              <div className="px-6 pb-6">
                {isLoadingReservations ? (
                  <div className="space-y-2 pt-2">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="kaju-skeleton h-4 w-12 rounded" />
                        <div className="kaju-skeleton h-4 w-24 rounded" />
                        <div className="kaju-skeleton h-4 flex-1 rounded" />
                        <div className="kaju-skeleton h-4 w-20 rounded" />
                        <div className="kaju-skeleton h-4 w-12 rounded" />
                      </div>
                    ))}
                  </div>
                ) : reservations.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted">
                    Nenhuma reserva encontrada.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                          Nº Pedido
                        </th>
                        <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                          Data
                        </th>
                        <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                          Cliente
                        </th>
                        <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                          Tipo
                        </th>
                        <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                          Qtd (cx)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((r) => (
                        <tr
                          key={`${r.orderId}-${r.boxType}`}
                          className="border-b border-border/40 last:border-0"
                        >
                          <td className="py-2.5 pr-4">
                            <Link
                              href={`/pedidos/novo?id=${r.orderId}`}
                              className="font-semibold text-accent underline-offset-2 hover:underline"
                            >
                              #{r.orderNumber}
                            </Link>
                          </td>
                          <td className="py-2.5 pr-4 tabular-nums text-muted">
                            {new Intl.DateTimeFormat("pt-BR", {
                              timeZone: "UTC",
                            }).format(new Date(r.orderDate))}
                          </td>
                          <td className="py-2.5 pr-4 font-medium text-foreground">
                            {r.clientName}
                          </td>
                          <td className="py-2.5 pr-4 text-center text-muted">
                            {r.boxType === "FULL"
                              ? "Completa"
                              : r.boxType === "HALF"
                                ? "Meia"
                                : r.boxType}
                          </td>
                          <td className="py-2.5 text-center tabular-nums font-semibold">
                            {r.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border">
                        <td
                          colSpan={4}
                          className="pt-2.5 text-xs font-semibold text-muted"
                        >
                          Total reservado
                        </td>
                        <td className="pt-2.5 text-center tabular-nums font-bold text-foreground">
                          {reservations.reduce((s, r) => s + r.quantity, 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <SendStockReportModal data={reportData} state={emailModalState} />
    </PageShell>
  );
}
