import Link from "next/link";
import type {
    LoteSemanalOpcao,
    TipoObjetoOpcao,
} from "@/lib/top-manager/repository/cione-f3pgi6/types";

export interface FiltrosAnalisesProps {
    dtInicial?: string;
    dtFinal?: string;
    loteId?: number;
    tipoId?: number;
    lotes: LoteSemanalOpcao[];
    tipos: TipoObjetoOpcao[];
}

export function FiltrosAnalises({
    dtInicial,
    dtFinal,
    loteId,
    tipoId,
    lotes,
    tipos,
}: FiltrosAnalisesProps) {
    return (
        <form
            className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
            method="get"
        >
            <div>
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor="dt">
                    De
                </label>
                <input
                    className="rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    defaultValue={dtInicial ?? ""}
                    id="dt"
                    name="dt"
                    type="date"
                />
            </div>

            <div>
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor="ate">
                    Até
                </label>
                <input
                    className="rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    defaultValue={dtFinal ?? ""}
                    id="ate"
                    name="ate"
                    type="date"
                />
            </div>

            <div>
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor="lote">
                    Lote
                </label>
                <select
                    className="min-w-44 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    defaultValue={loteId ? String(loteId) : ""}
                    id="lote"
                    name="lote"
                >
                    <option value="">Todos</option>
                    {lotes.map((l) => (
                        <option key={l.id} value={String(l.id)}>
                            {l.nome}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="mb-1 block text-xs font-medium text-muted" htmlFor="tipo">
                    Tipo
                </label>
                <select
                    className="min-w-44 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    defaultValue={tipoId ? String(tipoId) : ""}
                    id="tipo"
                    name="tipo"
                >
                    <option value="">Todos</option>
                    {tipos.map((t) => (
                        <option key={t.cdObj} value={String(t.cdObj)}>
                            {t.nome}
                        </option>
                    ))}
                </select>
            </div>

            <button
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                type="submit"
            >
                Filtrar
            </button>
            <Link
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
                href="/producao/analises"
            >
                Limpar
            </Link>
        </form>
    );
}