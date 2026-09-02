"use client";

import { useId } from "react";
import {
  Area,
  CartesianGrid,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyChart } from "./primitives";
import { ACCENT } from "./theme";

export type AreaPoint = {
  label: string;
  value: number;
  /** Linha secundária para o tooltip (ex.: "12 pedidos · 4.500 kg"). */
  meta?: string;
};

type AreaChartProps = {
  data: AreaPoint[];
  formatValue: (value: number) => string;
  formatAxis?: (value: number) => string;
  height?: number;
};

function AreaTooltip({
  active,
  payload,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ payload: AreaPoint }>;
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-md">
      <p className="text-[11px] text-muted">{point.label}</p>
      <p className="text-[13px] font-semibold tabular-nums text-foreground">
        {formatValue(point.value)}
      </p>
      {point.meta ? (
        <p className="mt-0.5 text-[11px] text-muted">{point.meta}</p>
      ) : null}
    </div>
  );
}

export function AreaChart({
  data,
  formatValue,
  formatAxis,
  height = 248,
}: AreaChartProps) {
  const gradientId = useId();

  if (data.length === 0) {
    return <EmptyChart />;
  }

  const fmtAxis = formatAxis ?? formatValue;

  return (
    <div
      className="w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted [&_.recharts-cartesian-grid_line]:stroke-border"
      style={{ height }}
    >
      <ResponsiveContainer height="100%" width="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.28} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            dy={6}
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fontSize: 11 }}
            tickFormatter={fmtAxis}
            tickLine={false}
            width={56}
          />
          <Tooltip
            content={<AreaTooltip formatValue={formatValue} />}
            cursor={{ stroke: ACCENT, strokeDasharray: "3 3" }}
          />
          <Area
            activeDot={{ r: 4, fill: ACCENT, stroke: ACCENT }}
            dataKey="value"
            dot={false}
            fill={`url(#${gradientId})`}
            stroke={ACCENT}
            strokeWidth={2.5}
            type="monotone"
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
