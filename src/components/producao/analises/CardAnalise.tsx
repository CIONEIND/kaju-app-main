import { Eye, Pencil } from "lucide-react";
import Link from "next/link";
import type { CardAnaliseDados } from "@/lib/analises/tipos";

export function CardAnalise({
    item,
    basePath,
}: {
    item: CardAnaliseDados;
    basePath: string;
}) {
    return (
        <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    Análise #{item.id}
                </p>
                <h3 className="mt-0.5 truncate font-semibold text-foreground">
                    {item.titulo}
                </h3>
            </div>

            <dl className="flex flex-col gap-1.5 text-sm">
                {item.linhas.map((l) => (
                    <div className="flex justify-between gap-2" key={l.label}>
                        <dt className="text-muted">{l.label}</dt>
                        <dd className="truncate font-medium text-foreground">{l.valor}</dd>
                    </div>
                ))}
            </dl>

            <div className="grid grid-cols-2 gap-2">
                {item.metricas.map((m) => (
                    <div className="rounded-lg bg-surface-secondary px-3 py-2" key={m.label}>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                            {m.label}
                        </p>
                        <p className="text-lg font-semibold text-foreground">{m.valor}</p>
                    </div>
                ))}
            </div>

            <div className="mt-auto flex items-center justify-end gap-1 border-t border-border pt-3">
                <Link
                    aria-label={`Visualizar análise ${item.id}`}
                    className="rounded-md p-1.5 text-muted hover:bg-surface-secondary hover:text-foreground"
                    href={`${basePath}/${item.id}`}
                >
                    <Eye size={16} />
                </Link>
                <Link
                    aria-label={`Editar análise ${item.id}`}
                    className="rounded-md p-1.5 text-muted hover:bg-surface-secondary hover:text-foreground"
                    href={`${basePath}/${item.id}/editar`}
                >
                    <Pencil size={16} />
                </Link>
            </div>
        </article>
    );
}