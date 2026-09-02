import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

type PanelProps = {
  children: ReactNode;
  className?: string;
};

type SectionHeadingProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <div
      className={`mx-auto flex w-full max-w-[1440px] flex-col gap-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-accent/80">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[1.6rem] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <section className={`kaju-panel rounded-xl ${className}`}>
      {children}
    </section>
  );
}

export function FilterBar({ children, className = "" }: PanelProps) {
  return (
    <section className={`kaju-filter-bar rounded-xl p-4 ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeading({
  title,
  description,
  actions,
}: SectionHeadingProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
