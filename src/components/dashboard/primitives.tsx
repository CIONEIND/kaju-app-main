import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

export type DeltaTone = "auto" | "neutral";

type KpiCardProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  /** Variação percentual vs. período anterior. null = sem comparação. */
  delta?: number | null;
  deltaTone?: DeltaTone;
};

function formatDelta(delta: number) {
  const abs = Math.abs(delta);
  const formatted = abs >= 100 ? abs.toFixed(0) : abs.toFixed(1);
  return `${formatted}%`;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  deltaTone = "auto",
}: KpiCardProps) {
  const hasDelta =
    delta !== null && delta !== undefined && Number.isFinite(delta);
  const isUp = hasDelta && (delta as number) > 0;
  const isDown = hasDelta && (delta as number) < 0;
  const isFlat = hasDelta && (delta as number) === 0;

  const toneClass =
    deltaTone === "neutral"
      ? "bg-surface-secondary text-muted"
      : isUp
        ? "bg-success/12 text-success"
        : isDown
          ? "bg-danger/12 text-danger"
          : "bg-surface-secondary text-muted";

  const DeltaIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;

  return (
    <div className="kaju-panel flex flex-col gap-3 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wider text-muted">
          {label}
        </span>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Icon size={16} />
          </span>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-[1.65rem] font-semibold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        {hasDelta && !isFlat ? (
          <span
            className={`flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${toneClass}`}
          >
            <DeltaIcon size={12} />
            {formatDelta(delta as number)}
          </span>
        ) : null}
      </div>

      {hint ? (
        <p className="text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type ChartCardProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ChartCard({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <section className={`kaju-panel flex flex-col rounded-xl p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

export function EmptyChart({
  message = "Sem dados no período.",
}: {
  message?: string;
}) {
  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-center text-muted">
      <svg
        aria-hidden="true"
        className="size-9 opacity-20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          d="M3 3v18h18M7 14l3-3 3 3 5-6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-xs">{message}</p>
    </div>
  );
}
