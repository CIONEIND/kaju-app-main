"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { EmptyChart } from "./primitives";

export type DonutDatum = {
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  data: DonutDatum[];
  formatValue: (value: number) => string;
  /** Texto pequeno exibido sob o total no centro. */
  centerCaption?: string;
};

function DonutTooltip({
  active,
  payload,
  formatValue,
  total,
}: {
  active?: boolean;
  payload?: Array<{ payload: DonutDatum }>;
  formatValue: (value: number) => string;
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : "0";
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-md">
      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        <span
          className="inline-block size-2 rounded-full"
          style={{ background: d.color }}
        />
        {d.label}
      </p>
      <p className="text-[13px] font-semibold tabular-nums text-foreground">
        {formatValue(d.value)} <span className="text-muted">· {pct}%</span>
      </p>
    </div>
  );
}

export function DonutChart({
  data,
  formatValue,
  centerCaption,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <EmptyChart />;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="relative size-[170px] shrink-0">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              endAngle={-270}
              innerRadius={56}
              nameKey="label"
              outerRadius={82}
              paddingAngle={data.length > 1 ? 2 : 0}
              startAngle={90}
              stroke="none"
            >
              {data.map((d) => (
                <Cell fill={d.color} key={d.label} />
              ))}
            </Pie>
            <Tooltip
              content={<DonutTooltip formatValue={formatValue} total={total} />}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums text-foreground">
            {formatValue(total)}
          </span>
          {centerCaption ? (
            <span className="text-[10px] uppercase tracking-wider text-muted">
              {centerCaption}
            </span>
          ) : null}
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2">
        {data.map((d) => (
          <li className="flex items-center gap-2.5 px-1" key={d.label}>
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: d.color }}
            />
            <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
              {d.label}
            </span>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums text-foreground">
              {formatValue(d.value)}
            </span>
            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
