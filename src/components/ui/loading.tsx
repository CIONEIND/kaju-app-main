type SkeletonProps = {
  className?: string;
};

type TableSkeletonProps = {
  columns?: number;
  rows?: number;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`kaju-skeleton ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-3.5 w-[380px] max-w-full" />
        </div>
        <Skeleton className="h-9 w-32 shrink-0 rounded-lg" />
      </div>
      <div className="kaju-filter-bar rounded-xl p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-10 rounded-lg md:col-span-2" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>
      <TableSkeleton columns={5} rows={6} />
    </div>
  );
}

const CELL_WIDTHS = ["w-full", "w-4/5", "w-3/5", "w-2/3", "w-5/6", "w-3/4", "w-4/5", "w-2/3", "w-full"];

export function TableSkeleton({ columns = 5, rows = 6 }: TableSkeletonProps) {
  const columnItems = Array.from({ length: columns }, (_, i) => ({ key: `col-${i}`, index: i }));
  const rowItems = Array.from({ length: rows }, (_, i) => ({ key: `row-${i}`, index: i }));

  return (
    <div className="kaju-panel overflow-hidden rounded-xl">
      <div
        className="grid gap-4 border-b border-border bg-surface-secondary/60 px-5 py-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {columnItems.map((col) => (
          <Skeleton className="h-2.5 w-1/2" key={`header-${col.key}`} />
        ))}
      </div>
      <div className="divide-y divide-separator">
        {rowItems.map((row) => (
          <div
            className="grid gap-4 px-5 py-[14px]"
            key={row.key}
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {columnItems.map((col) => {
              const widthClass = CELL_WIDTHS[(col.index + row.index * 3) % CELL_WIDTHS.length];
              return (
                <Skeleton
                  className={`h-4 ${widthClass}`}
                  key={`cell-${row.key}-${col.key}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="kaju-panel rounded-xl p-6">
      <div className="mb-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2.5 h-3.5 w-64 max-w-full" />
      </div>
      <div className="grid gap-5 md:grid-cols-4">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg md:col-span-2" />
        <Skeleton className="h-10 rounded-lg md:col-span-2" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
    </div>
  );
}
