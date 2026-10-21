import Link from "next/link";
import type { FiltrosDisponiveis, OpcaoCombo } from "@/lib/analises/tipos";

export interface FiltrosAnalisesProps {
    dtInicial?: string;
    dtFinal?: string;
    loteId?: number;
    tipoId?: number;
    siloId?: number;
    lotes: OpcaoCombo[];
    tipos: OpcaoCombo[];
    silos?: OpcaoCombo[];
    disponiveis: FiltrosDisponiveis;
    limparHref: string;
}

const campo =
    "min-w-44 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30";

export function FiltrosAnalises(p: FiltrosAnalisesProps) {
    return (
        <form
            className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
            method="get"
        >
            {p.disponiveis.periodo && (
                <>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted" htmlFor="dt">De</label>
                        <input className={campo} defaultValue={p.dtInicial ?? ""} id="dt" name="dt" type="date" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted" htmlFor="ate">Até</label>
                        <input className={campo} defaultValue={p.dtFinal ?? ""} id="ate" name="ate" type="date" />
                    </div>
                </>
            )}

            {p.disponiveis.lote && (
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted" htmlFor="lote">Lote</label>
                    <select className={campo} defaultValue={p.loteId ? String(p.loteId) : ""} id="lote" name="lote">
                        <option value="">Todos</option>
                        {p.lotes.map((o) => (
                            <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                        ))}
                    </select>
                </div>
            )}

            {p.disponiveis.silo && (
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted" htmlFor="silo">Silo</label>
                    <select className={campo} defaultValue={p.siloId ? String(p.siloId) : ""} id="silo" name="silo">
                        <option value="">Todos</option>
                        {(p.silos ?? []).map((o) => (
                            <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                        ))}
                    </select>
                </div>
            )}

            {p.disponiveis.tipo && (
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted" htmlFor="tipo">Tipo</label>
                    <select className={campo} defaultValue={p.tipoId ? String(p.tipoId) : ""} id="tipo" name="tipo">
                        <option value="">Todos</option>
                        {p.tipos.map((o) => (
                            <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                        ))}
                    </select>
                </div>
            )}

            <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90" type="submit">
                Filtrar
            </button>
            <Link className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground" href={p.limparHref}>
                Limpar
            </Link>
        </form>
    );
}