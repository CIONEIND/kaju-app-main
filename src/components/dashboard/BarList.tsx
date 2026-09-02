"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyChart } from "./primitives";
import { ACCENT, CHART_PALETTE } from "./theme";

export type BarListItem = {
  label: string;
  value: number;
  /** Texto secundário no tooltip (ex.: "8 pedidos" ou peso). */
  meta?: string;
};

type BarListProps = {
  data: BarListItem[];
  formatValue: (value: number) => string;
  /** Cor única para todas as barras; se omitido, usa a paleta. */
  color?: string;
};

function truncate(label: string, max = 18) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function BarTooltip({
  active,
  payload,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ payload: BarListItem }>;
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="max-w-[220px] rounded-lg border border-border bg-surface px-3 py-2 shadow-md">
      <p className="text-[11px] text-muted">{d.label}</p>
      <p className="text-[13px] font-semibold tabular-nums text-foreground">
        {formatValue(d.value)}
        {d.meta ? <span className="text-muted"> · {d.meta}</span> : null}
      </p>
    </div>
  );
}

export function BarList({ data, formatValue, color }: BarListProps) {
  if (data.length === 0) {
    return <EmptyChart />;
  }

  const height = data.length * 40 + 8;

  return (
    <div
      className="w-full [&_.recharts-cartesian-axis-tick_text]:fill-foreground [&_.recharts-label-list_text]:fill-muted"
      style={{ height }}
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ bottom: 0, left: 0, right: 56, top: 0 }}
        >
          <XAxis dataKey="value" hide type="number" />
          <YAxis
            axisLine={false}
            dataKey="label"
            tick={{ fontSize: 12 }}
            tickFormatter={(v: string) => truncate(v)}
            tickLine={false}
            type="category"
            width={124}
          />
          <Tooltip
            content={<BarTooltip formatValue={formatValue} />}
            cursor={{ fill: ACCENT, fillOpacity: 0.06 }}
          />
          <Bar barSize={18} dataKey="value" radius={[0, 5, 5, 0]}>
            {data.map((d, i) => (
              <Cell
                fill={color ?? CHART_PALETTE[i % CHART_PALETTE.length]}
                key={d.label}
              />
            ))}
            <LabelList
              dataKey="value"
              formatter={(v) => formatValue(Number(v))}
              fontSize={11}
              offset={8}
              position="right"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
