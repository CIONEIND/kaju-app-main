import type { ClientPricePoint } from "@/mocks/purchaseOrder";

const formatChartCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

interface PriceTrendChartProps {
  data: ClientPricePoint[];
}

export function PriceTrendChart({ data }: PriceTrendChartProps) {
  if (data.length === 0) {
    return null;
  }

  const width = 640;
  const height = 260;
  const padding = { top: 18, right: 44, bottom: 38, left: 18 };
  const values = data.flatMap((point) => [
    point.clientPricePerKg,
    point.basePricePerKg,
  ]);
  const minValue = Math.floor((Math.min(...values) - 1) * 2) / 2;
  const maxValue = Math.ceil((Math.max(...values) + 1) * 2) / 2;
  const range = maxValue - minValue || 1;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xStep = data.length === 1 ? 0 : chartWidth / (data.length - 1);
  const xForIndex = (index: number) =>
    data.length === 1
      ? padding.left + chartWidth / 2
      : padding.left + index * xStep;
  const yForValue = (value: number) =>
    padding.top + ((maxValue - value) / range) * chartHeight;
  const yGuides = Array.from(
    { length: 4 },
    (_, index) => maxValue - (range * index) / 3,
  );

  const clientLine = data
    .map(
      (point, index) =>
        `${xForIndex(index)},${yForValue(point.clientPricePerKg)}`,
    )
    .join(" ");
  const baseLine = data
    .map(
      (point, index) =>
        `${xForIndex(index)},${yForValue(point.basePricePerKg)}`,
    )
    .join(" ");

  return (
    <div className="rounded-2xl border border-border bg-white/70 p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-2 text-foreground">
            <span className="inline-flex h-0.5 w-6 rounded-full bg-teal-700" />
            Preco praticado
          </span>
          <span className="flex items-center gap-2 text-muted">
            <span className="inline-flex h-0.5 w-6 rounded-full border-t-2 border-dashed border-slate-400" />
            Tabela base
          </span>
        </div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted">
          preco por kg
        </p>
      </div>

      <svg
        aria-label="Grafico de tendencia de preco por quilo"
        className="h-auto w-full"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {yGuides.map((guide) => {
          const y = yForValue(guide);
          return (
            <g key={guide}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                className="stroke-border/80"
                strokeDasharray="4 6"
              />
              <text
                fill="currentColor"
                fontSize="11"
                textAnchor="start"
                x={width - padding.right + 8}
                y={y + 4}
                className="text-muted"
              >
                {formatChartCurrency(guide)}
              </text>
            </g>
          );
        })}

        <polyline
          fill="none"
          points={baseLine}
          stroke="#94a3b8"
          strokeDasharray="7 7"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <polyline
          fill="none"
          points={clientLine}
          stroke="#0f766e"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />

        {data.map((point, index) => {
          const x = xForIndex(index);
          return (
            <g key={point.month}>
              <circle
                cx={x}
                cy={yForValue(point.basePricePerKg)}
                fill="#cbd5e1"
                r="4"
              />
              <circle
                cx={x}
                cy={yForValue(point.clientPricePerKg)}
                fill="#0f766e"
                r="4.5"
              />
              <text
                fill="currentColor"
                fontSize="11"
                textAnchor="middle"
                x={x}
                y={height - 10}
                className="text-muted"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
