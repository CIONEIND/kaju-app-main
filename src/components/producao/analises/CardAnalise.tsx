// src/app/(producao)/producao/components/CardAnalise.tsx
"use client";

import type { Analise } from "@/app/(protected)/(producao)/producao/analises/types";

interface Props {
    analise: Analise;
    podeEditar: boolean;
    podeExcluir: boolean;
    onExcluir: (id: string) => void;
}

export function CardAnalise({ analise, podeEditar, podeExcluir, onExcluir }: Props) {
    const data = new Date(analise.dataHora);
    const dataFmt = data.toLocaleDateString("pt-BR");
    const horaFmt = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    return (
        <article className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h3 className="font-semibold text-gray-900">{analise.tipoNome}</h3>
                    <p className="text-xs text-gray-500">
                        Lote {analise.lote} · {analise.processo}
                    </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {analise.status}
                </span>
            </div>

            <p className="mt-2 text-sm text-gray-600">
                {dataFmt} às {horaFmt} · {analise.operador}
            </p>

            <div className="mt-3 flex items-center justify-between">
                <a
                    href={`/producao/analises/${analise.tipoCodigo}/${analise.id}`}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Clique para mais detalhes
                </a>

                {(podeEditar || podeExcluir) && (
                    <div className="flex gap-3">
                        {podeEditar && (
                            <button className="text-xs text-gray-500 hover:text-blue-600">Editar</button>
                        )}
                        {podeExcluir && (
                            <button
                                onClick={() => onExcluir(analise.id)}
                                className="text-xs text-gray-500 hover:text-red-600"
                            >
                                Excluir
                            </button>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}