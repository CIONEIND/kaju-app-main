"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  Clock,
  DollarSign,
  Package,
  Receipt,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AreaChart } from "@/components/dashboard/AreaChart";
import { BarList } from "@/components/dashboard/BarList";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { ChartCard, KpiCard } from "@/components/dashboard/primitives";
import {
  ACCENT,
  FINANCIAL_STATUS_COLORS,
  ORDER_STATUS_COLORS,
  STOCK_STATUS_COLORS,
} from "@/components/dashboard/theme";
import { PageHeader, PageShell } from "@/components/ui/page";

// --- Tipos (espelham PurchaseOrderSummary da listagem) ---

type OrderItem = {
  id: string;
  productId: number;
  productName: string | null;
  quantity: number;
  totalWeight: number;
  totalPrice: number;
};

type OrderSummary = {
  id: string;
  number: number;
  date: string; // YYYY-MM-DD
  clientName: string;
  orderStatus: string;
  financialStatus: string;
  stockStatus: string;
  totalWeightKg: number;
  boxes: number;
  totalPrice: number;
  items: OrderItem[];
};

const CONFIRMED = "Confirmado";
const DRAFT = "Orçamento";
const AWAITING = "Aguardando pagamento";
const NOT_RESERVED = "Estoque não reservado";

// --- Formatação ---

const brl = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
  maximumFractionDigits: 0,
});
const brlPrecise = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});
const formatCurrency = (v: number) => brl.format(v);
const formatCurrencyPrecise = (v: number) => brlPrecise.format(v);
const formatCompactCurrency = (v: number) => {
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
};
const formatWeight = (v: number) =>
  `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v)} kg`;
const formatInt = (v: number) =>
  new Intl.NumberFormat("pt-BR").format(Math.round(v));

// --- Períodos ---

type Period = "month" | "quarter" | "year" | "12m" | "all";

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "month", label: "Este mês" },
  { key: "quarter", label: "3 meses" },
  { key: "year", label: "Este ano" },
  { key: "12m", label: "12 meses" },
  { key: "all", label: "Tudo" },
];

function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPeriodRange(period: Period) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const end = new Date(y, m, now.getDate());
  let start: Date;
  switch (period) {
    case "month":
      start = new Date(y, m, 1);
      break;
    case "quarter":
      start = new Date(y, m - 2, 1);
      break;
    case "year":
      start = new Date(y, 0, 1);
      break;
    case "12m":
      start = new Date(y, m - 11, 1);
      break;
    default:
      return { start: null, end: null, prevStart: null, prevEnd: null };
  }
  const span = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 86_400_000);
  const prevStart = new Date(prevEnd.getTime() - span);
  return {
    start: fmtDate(start),
    end: fmtDate(end),
    prevStart: fmtDate(prevStart),
    prevEnd: fmtDate(prevEnd),
  };
}

function inRange(date: string, start: string | null, end: string | null) {
  if (!start || !end) return true;
  return date >= start && date <= end;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

const monthLabelFmt = new Intl.DateTimeFormat("pt-BR", { month: "short" });

// --- Página ---

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("12m");

  const {
    data: orders = [],
    isPending,
    error,
  } = useQuery<OrderSummary[]>({
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

  const metrics = useMemo(() => {
    const range = getPeriodRange(period);

    const confirmed = orders.filter((o) => o.orderStatus === CONFIRMED);
    const inPeriod = confirmed.filter((o) =>
      inRange(o.date, range.start, range.end),
    );
    const inPrev = confirmed.filter((o) =>
      inRange(o.date, range.prevStart, range.prevEnd),
    );

    const sumPrice = (list: OrderSummary[]) =>
      list.reduce((s, o) => s + o.totalPrice, 0);
    const sumWeight = (list: OrderSummary[]) =>
      list.reduce((s, o) => s + o.totalWeightKg, 0);

    const revenue = sumPrice(inPeriod);
    const prevRevenue = sumPrice(inPrev);
    const count = inPeriod.length;
    const prevCount = inPrev.length;
    const ticket = count > 0 ? revenue / count : 0;
    const prevTicket = prevCount > 0 ? prevRevenue / prevCount : 0;
    const weight = sumWeight(inPeriod);
    const prevWeight = sumWeight(inPrev);

    // Recebíveis (confirmados, aguardando pagamento) — visão global (não filtra período)
    const receivable = confirmed
      .filter((o) => o.financialStatus === AWAITING)
      .reduce((s, o) => s + o.totalPrice, 0);
    const receivableCount = confirmed.filter(
      (o) => o.financialStatus === AWAITING,
    ).length;

    // Pendências operacionais (visão global)
    const drafts = orders.filter((o) => o.orderStatus === DRAFT);
    const draftsValue = sumPrice(drafts);
    const awaitingStock = confirmed.filter(
      (o) => o.stockStatus === NOT_RESERVED,
    );

    // Faturamento — últimos 12 meses (independente do filtro)
    const now = new Date();
    const monthly: { label: string; value: number; meta?: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthOrders = confirmed.filter((o) => o.date.slice(0, 7) === key);
      const value = sumPrice(monthOrders);
      const isJan = d.getMonth() === 0;
      monthly.push({
        label: isJan
          ? `${monthLabelFmt.format(d)}/${String(d.getFullYear()).slice(2)}`
          : monthLabelFmt.format(d),
        value,
        meta: `${monthOrders.length} ${monthOrders.length === 1 ? "pedido" : "pedidos"} · ${formatWeight(sumWeight(monthOrders))}`,
      });
    }

    // Distribuição por status do pedido (todos os pedidos no período do filtro)
    const allInPeriod = orders.filter((o) =>
      inRange(o.date, range.start, range.end),
    );
    const byOrderStatus = ["Confirmado", "Orçamento", "Cancelado"]
      .map((status) => ({
        label: status,
        value: allInPeriod.filter((o) => o.orderStatus === status).length,
        color: ORDER_STATUS_COLORS[status],
      }))
      .filter((d) => d.value > 0);

    // Status de pagamento (confirmados no período, por valor)
    const byFinancial = ["Pago", "Faturado via boleto", AWAITING]
      .map((status) => ({
        label: status,
        value: inPeriod
          .filter((o) => o.financialStatus === status)
          .reduce((s, o) => s + o.totalPrice, 0),
        color: FINANCIAL_STATUS_COLORS[status],
      }))
      .filter((d) => d.value > 0);

    // Status de estoque (confirmados no período)
    const byStock = ["Produtos retirados", "Estoque reservado", NOT_RESERVED]
      .map((status) => ({
        label: status,
        value: inPeriod.filter((o) => o.stockStatus === status).length,
        color: STOCK_STATUS_COLORS[status],
      }))
      .filter((d) => d.value > 0);

    // Top clientes (confirmados no período, por faturamento)
    const clientMap = new Map<string, { value: number; orders: number }>();
    for (const o of inPeriod) {
      const cur = clientMap.get(o.clientName) ?? { value: 0, orders: 0 };
      cur.value += o.totalPrice;
      cur.orders += 1;
      clientMap.set(o.clientName, cur);
    }
    const topClients = Array.from(clientMap.entries())
      .map(([label, v]) => ({
        label,
        value: v.value,
        meta: `${v.orders} ${v.orders === 1 ? "pedido" : "pedidos"}`,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Top produtos (confirmados no período, por faturamento e peso)
    const productMap = new Map<string, { value: number; weight: number }>();
    for (const o of inPeriod) {
      for (const item of o.items) {
        const name = item.productName ?? `Produto #${item.productId}`;
        const cur = productMap.get(name) ?? { value: 0, weight: 0 };
        cur.value += item.totalPrice;
        cur.weight += item.totalWeight;
        productMap.set(name, cur);
      }
    }
    const topProducts = Array.from(productMap.entries())
      .map(([label, v]) => ({
        label,
        value: v.value,
        meta: formatWeight(v.weight),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      revenue,
      revenueDelta: pctChange(revenue, prevRevenue),
      count,
      countDelta: pctChange(count, prevCount),
      ticket,
      ticketDelta: pctChange(ticket, prevTicket),
      weight,
      weightDelta: pctChange(weight, prevWeight),
      receivable,
      receivableCount,
      drafts: drafts.length,
      draftsValue,
      awaitingStock: awaitingStock.length,
      monthly,
      byOrderStatus,
      byFinancial,
      byStock,
      topClients,
      topProducts,
      hasData: orders.length > 0,
    };
  }, [orders, period]);

  const periodLabel = PERIOD_OPTIONS.find((p) => p.key === period)?.label ?? "";
  const comparisonHint = period === "all" ? undefined : "vs. período anterior";

  return (
    <PageShell>
      <PageHeader
        description="Indicadores de vendas, faturamento e operação para apoiar a tomada de decisão."
        eyebrow="Visão geral"
        title="Dashboard"
        actions={
          <div className="flex flex-wrap gap-1 rounded-xl bg-surface-secondary p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  period === opt.key
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <div className="kaju-panel flex items-center gap-3 rounded-xl border-danger/30 bg-danger/5 p-5 text-danger">
          <AlertTriangle size={18} />
          <span className="text-sm">
            {error instanceof Error ? error.message : "Erro ao carregar dados."}
          </span>
        </div>
      ) : isPending ? (
        <DashboardSkeleton />
      ) : !metrics.hasData ? (
        <div className="kaju-panel rounded-xl p-12 text-center text-muted">
          <ShoppingCart className="mx-auto mb-3 size-10 opacity-20" />
          <p className="text-sm">
            Ainda não há pedidos cadastrados.{" "}
            <Link className="font-medium text-accent" href="/pedidos/novo">
              Criar o primeiro pedido
            </Link>
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              delta={metrics.revenueDelta}
              hint={`Pedidos confirmados · ${periodLabel}${comparisonHint ? ` · ${comparisonHint}` : ""}`}
              icon={DollarSign}
              label="Faturamento"
              value={formatCurrency(metrics.revenue)}
            />
            <KpiCard
              delta={metrics.countDelta}
              hint={`Confirmados · ${periodLabel}`}
              icon={ShoppingCart}
              label="Pedidos"
              value={formatInt(metrics.count)}
            />
            <KpiCard
              delta={metrics.ticketDelta}
              hint="Faturamento / nº de pedidos"
              icon={Receipt}
              label="Ticket médio"
              value={formatCurrency(metrics.ticket)}
            />
            <KpiCard
              delta={metrics.weightDelta}
              hint={`Volume comercializado · ${periodLabel}`}
              icon={Boxes}
              label="Volume"
              value={formatWeight(metrics.weight)}
            />
          </div>

          {/* Faturamento mensal + status do pedido */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              subtitle="Pedidos confirmados nos últimos 12 meses"
              title="Faturamento mensal"
            >
              <AreaChart
                data={metrics.monthly}
                formatAxis={formatCompactCurrency}
                formatValue={formatCurrencyPrecise}
              />
            </ChartCard>

            <ChartCard
              subtitle={`Distribuição · ${periodLabel}`}
              title="Pedidos por status"
            >
              <DonutChart
                centerCaption="Pedidos"
                data={metrics.byOrderStatus}
                formatValue={formatInt}
              />
            </ChartCard>
          </div>

          {/* Top clientes + top produtos */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              subtitle={`Por faturamento · ${periodLabel}`}
              title="Top clientes"
            >
              <BarList
                color={ACCENT}
                data={metrics.topClients}
                formatValue={formatCurrency}
              />
            </ChartCard>

            <ChartCard
              subtitle={`Por faturamento · ${periodLabel}`}
              title="Top produtos"
            >
              <BarList
                data={metrics.topProducts}
                formatValue={formatCurrency}
              />
            </ChartCard>
          </div>

          {/* Pagamento + estoque + pendências */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              subtitle={`Faturamento confirmado · ${periodLabel}`}
              title="Status de pagamento"
            >
              <DonutChart
                centerCaption="Total"
                data={metrics.byFinancial}
                formatValue={formatCurrency}
              />
            </ChartCard>

            <ChartCard
              subtitle={`Pedidos confirmados · ${periodLabel}`}
              title="Status de estoque"
            >
              <DonutChart
                centerCaption="Pedidos"
                data={metrics.byStock}
                formatValue={formatInt}
              />
            </ChartCard>

            <ChartCard subtitle="Itens que pedem atenção" title="Pendências">
              <ul className="flex flex-col gap-3">
                <PendingRow
                  href="/pedidos"
                  icon={Wallet}
                  label="A receber"
                  sub={`${metrics.receivableCount} ${metrics.receivableCount === 1 ? "pedido" : "pedidos"} aguardando pagamento`}
                  tone="warning"
                  value={formatCurrency(metrics.receivable)}
                />
                <PendingRow
                  href="/pedidos"
                  icon={Package}
                  label="Estoque a reservar"
                  sub="Confirmados sem reserva de estoque"
                  tone="accent"
                  value={`${metrics.awaitingStock}`}
                />
                <PendingRow
                  href="/pedidos"
                  icon={Clock}
                  label="Orçamentos"
                  sub={`${formatCurrency(metrics.draftsValue)} em pedidos não confirmados`}
                  tone="muted"
                  value={`${metrics.drafts}`}
                />
              </ul>
            </ChartCard>
          </div>
        </>
      )}
    </PageShell>
  );
}

function PendingRow({
  icon: Icon,
  label,
  sub,
  value,
  tone,
  href,
}: {
  icon: typeof Wallet;
  label: string;
  sub: string;
  value: string;
  tone: "warning" | "accent" | "muted";
  href: string;
}) {
  const toneClass =
    tone === "warning"
      ? "bg-warning/15 text-warning"
      : tone === "accent"
        ? "bg-accent/12 text-accent"
        : "bg-surface-secondary text-muted";
  return (
    <li>
      <Link
        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-secondary/60"
        href={href}
      >
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
        >
          <Icon size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-foreground">
            {label}
          </span>
          <span className="block truncate text-[11px] text-muted">{sub}</span>
        </span>
        <span className="shrink-0 text-base font-semibold tabular-nums text-foreground">
          {value}
        </span>
      </Link>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["kpi-1", "kpi-2", "kpi-3", "kpi-4"].map((k) => (
          <div className="kaju-panel rounded-xl p-5" key={k}>
            <div className="kaju-skeleton mb-3 h-3 w-20 rounded" />
            <div className="kaju-skeleton h-7 w-28 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="kaju-panel h-[300px] rounded-xl p-5 lg:col-span-2">
          <div className="kaju-skeleton h-full w-full rounded-lg" />
        </div>
        <div className="kaju-panel h-[300px] rounded-xl p-5">
          <div className="kaju-skeleton h-full w-full rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {["row-1", "row-2"].map((k) => (
          <div className="kaju-panel h-[260px] rounded-xl p-5" key={k}>
            <div className="kaju-skeleton h-full w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
