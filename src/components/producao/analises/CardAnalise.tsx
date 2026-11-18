"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { excluirRascunho } from "@/app/services/producao/analises/excluirRascunho";
import type { CardAnaliseDados } from "@/lib/analises/tipos";
import { CardAnaliseAcoes } from "./CardAnaliseAcoes";

export function CardAnalise({
    item,
    basePath,
    tipo,
}: {
    item: CardAnaliseDados;
    basePath: string;
    tipo: string;
}) {
    const router = useRouter();
    const [excluindo, setExcluindo] = useState(false);
    const [confirmando, setConfirmando] = useState(false);

    const ehRascunho = item.status === "rascunho";

    async function excluir() {
        setExcluindo(true);
        const r = await excluirRascunho(tipo as any, item.id);
        setExcluindo(false);

        if (!r.ok) {
            alert(r.erro ?? "Erro ao excluir o rascunho.");
            return;
        }
        setConfirmando(false);
        router.refresh();
    }

    return (
        <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="min-w-0">
                {ehRascunho && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Rascunho
                    </span>
                )}
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

            <div className="mt-auto flex flex-wrap items-center justify-end gap-1 border-t border-border pt-3">
                {/* Rascunho não envia e-mail nem gera PDF */}
                {!ehRascunho && <CardAnaliseAcoes item={item} tipo={tipo} />}

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

                {/* Lixeira só em rascunho */}
                {ehRascunho && (
                    <button
                        aria-label={`Excluir rascunho ${item.id}`}
                        className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        disabled={excluindo}
                        onClick={() => setConfirmando(true)}
                        title="Excluir rascunho"
                        type="button"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Confirmação inline — sem modal, mais leve no card */}
            {confirmando && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs text-red-800">
                        Excluir o rascunho #{item.id}? Esta ação não pode ser desfeita.
                    </p>
                    <div className="mt-2 flex justify-end gap-2">
                        <button
                            className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted hover:text-foreground"
                            onClick={() => setConfirmando(false)}
                            type="button"
                        >
                            Cancelar
                        </button>
                        <button
                            className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            disabled={excluindo}
                            onClick={excluir}
                            type="button"
                        >
                            {excluindo ? "Excluindo…" : "Excluir"}
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
}