"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Combobox } from "@/components/producao/ui/Combobox";
import type {
    FiltrosDisponiveis,
    OpcaoCombo,
    StatusAnalise,
} from "@/lib/analises/tipos";

export interface FiltrosAnalisesProps {
    dtInicial?: string;
    dtFinal?: string;
    loteId?: number;
    tipoId?: number;
    siloId?: number;
    origemId?: number;
    status?: StatusAnalise;
    lotes: OpcaoCombo[];
    tipos: OpcaoCombo[];
    silos?: OpcaoCombo[];
    origens?: OpcaoCombo[];
    disponiveis: FiltrosDisponiveis;
    limparHref: string;
}

const campo =
    "min-w-44 rounded-md border border-border bg-surface-secondary px-3 py-2 text-base outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm";

const SITUACOES: { valor: StatusAnalise; rotulo: string }[] = [
    { valor: "concluida", rotulo: "Concluídas" },
    { valor: "rascunho", rotulo: "Rascunhos" },
];

export function FiltrosAnalises(p: FiltrosAnalisesProps) {
    const [lote, setLote] = useState(p.loteId ? String(p.loteId) : "");
    const [tipo, setTipo] = useState(p.tipoId ? String(p.tipoId) : "");
    const [silo, setSilo] = useState(p.siloId ? String(p.siloId) : "");
    const [origem, setOrigem] = useState(p.origemId ? String(p.origemId) : "");
    const [status, setStatus] = useState<StatusAnalise>(
        p.status ?? "concluida",
    );

    const comTodos = useMemo(
        () =>
            (lista: OpcaoCombo[], rotulo = "Todos"): OpcaoCombo[] => [
                { valor: "", rotulo },
                ...lista,
            ],
        [],
    );

    const opcoesLotes = useMemo(() => comTodos(p.lotes), [comTodos, p.lotes]);
    const opcoesTipos = useMemo(() => comTodos(p.tipos), [comTodos, p.tipos]);
    const opcoesSilos = useMemo(
        () => comTodos(p.silos ?? []),
        [comTodos, p.silos],
    );
    const opcoesOrigens = useMemo(
        () => comTodos(p.origens ?? [], "Todas"),
        [comTodos, p.origens],
    );

    return (
        <form
            className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
            method="get"
        >
            {/* Valores dos comboboxes e da situação viajam como hidden:
          o Combobox é controlado e não expõe atributo name. */}
            <input name="status" type="hidden" value={status} />
            {p.disponiveis.lote && <input name="lote" type="hidden" value={lote} />}
            {p.disponiveis.tipo && <input name="tipo" type="hidden" value={tipo} />}
            {p.disponiveis.silo && <input name="silo" type="hidden" value={silo} />}
            {p.disponiveis.origem && (
                <input name="origem" type="hidden" value={origem} />
            )}

            <div>
                <span className="mb-1 block text-xs font-medium text-muted">
                    Situação
                </span>
                <div className="flex gap-1 rounded-lg border border-border bg-surface-secondary p-1">
                    {SITUACOES.map((s) => (
                        <button
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${status === s.valor
                                    ? "bg-accent text-white"
                                    : "text-muted hover:text-foreground"
                                }`}
                            key={s.valor}
                            onClick={() => setStatus(s.valor)}
                            type="button"
                        >
                            {s.rotulo}
                        </button>
                    ))}
                </div>
            </div>

            {p.disponiveis.periodo && (
                <>
                    <div>
                        <label
                            className="mb-1 block text-xs font-medium text-muted"
                            htmlFor="dt"
                        >
                            De
                        </label>
                        <input
                            className={campo}
                            defaultValue={p.dtInicial ?? ""}
                            id="dt"
                            name="dt"
                            type="date"
                        />
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-xs font-medium text-muted"
                            htmlFor="ate"
                        >
                            Até
                        </label>
                        <input
                            className={campo}
                            defaultValue={p.dtFinal ?? ""}
                            id="ate"
                            name="ate"
                            type="date"
                        />
                    </div>
                </>
            )}

            {p.disponiveis.lote && (
                <div className="w-52">
                    <span className="mb-1 block text-xs font-medium text-muted">
                        Lote
                    </span>
                    <Combobox
                        onChange={setLote}
                        opcoes={opcoesLotes}
                        placeholder="Todos"
                        valor={lote}
                    />
                </div>
            )}

            {p.disponiveis.silo && (
                <div className="w-44">
                    <span className="mb-1 block text-xs font-medium text-muted">
                        Silo
                    </span>
                    <Combobox
                        onChange={setSilo}
                        opcoes={opcoesSilos}
                        placeholder="Todos"
                        valor={silo}
                    />
                </div>
            )}

            {p.disponiveis.origem && (
                <div className="w-48">
                    <span className="mb-1 block text-xs font-medium text-muted">
                        Origem
                    </span>
                    <Combobox
                        onChange={setOrigem}
                        opcoes={opcoesOrigens}
                        placeholder="Todas"
                        valor={origem}
                    />
                </div>
            )}

            {p.disponiveis.tipo && (
                <div className="w-48">
                    <span className="mb-1 block text-xs font-medium text-muted">
                        Tipo
                    </span>
                    <Combobox
                        onChange={setTipo}
                        opcoes={opcoesTipos}
                        placeholder="Todos"
                        valor={tipo}
                    />
                </div>
            )}

            <button
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                type="submit"
            >
                Filtrar
            </button>

            <Link
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
                href={p.limparHref}
            >
                Limpar
            </Link>
        </form>
    );
}