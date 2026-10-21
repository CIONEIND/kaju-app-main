import { Eye, Pencil } from "lucide-react";
import Link from "next/link";
import type { AnaliseF3PGI6 } from "@/lib/top-manager/repository/cione-f3pgi6/types";

function formatarNumero(valor: number | null): string {
    if (valor === null) return "—";
    return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function CardAnalise({ analise }: { analise: AnaliseF3PGI6 }) {
    return (
        <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                        F3PGI6 · #{analise.id}
                    </p>
                    <h3 className="mt-0.5 truncate font-semibold text-foreground">
                        {analise.tipoNome ?? "—"}
                    </h3>
                </div>
            </div>

            <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between gap-2">
                    <dt className="text-muted">Lote</dt>
                    <dd className="truncate font-medium text-foreground">
                        {analise.loteNome ?? "—"}
                    </dd>
                </div>
                <div className="flex justify-between gap-2">
                    <dt className="text-muted">Data</dt>
                    <dd className="font-medium text-foreground">
                        {analise.data}
                        {analise.hora ? ` · ${analise.hora}` : ""}
                    </dd>
                </div>
                <div className="flex justify-between gap-2">
                    <dt className="text-muted">Responsável</dt>
                    <dd className="truncate font-medium text-foreground">
                        {analise.responsavelNome ?? "—"}
                    </dd>
                </div>
            </dl>

            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-surface-secondary px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                        Média amêndoa
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                        {formatarNumero(analise.mediaAmendoa)}
                    </p>
                </div>
                <div className="rounded-lg bg-surface-secondary px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                        Média casca
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                        {formatarNumero(analise.mediaCasca)}
                    </p>
                </div>
            </div>

            <div className="mt-auto flex items-center justify-end gap-1 border-t border-border pt-3">
                <Link
                    aria-label={`Visualizar análise ${analise.id}`}
                    className="rounded-md p-1.5 text-muted hover:bg-surface-secondary hover:text-foreground"
                    href={`/producao/analises/F3PGI6/${analise.id}`}
                >
                    <Eye size={16} />
                </Link>
                <Link
                    aria-label={`Editar análise ${analise.id}`}
                    className="rounded-md p-1.5 text-muted hover:bg-surface-secondary hover:text-foreground"
                    href={`/producao/analises/F3PGI6/${analise.id}/editar`}
                >
                    <Pencil size={16} />
                </Link>
            </div>
        </article>
    );
}