// src/app/(producao)/producao/components/FiltrosAnalises.tsx
"use client";


// src/app/(producao)/producao/components/FiltrosAnalises.tsx
"use client";

import { useState } from "react";
import { TIPOS_FORMULARIO } from "./mock-analises";
import type { Processo } from "@/app/(protected)/(producao)/producao/types";

interface Props {
    processo: "TODOS" | Processo;
    onProcesso: (p: "TODOS" | Processo) => void;
    tipo: string; // "" = todos
    onTipo: (t: string) => void;
    dataInicio: string; // "YYYY-MM-DD" ou ""
    onDataInicio: (d: string) => void;
    dataFim: string;
    onDataFim: (d: string) => void;
    busca: string;
    onBusca: (b: string) => void;
    onLimpar: () => void;
}

const OPCOES_PROCESSO = [
    { valor: "TODOS", rotulo: "Todos" },
    { valor: "CAST", rotulo: "Proc. Cast" },
    { valor: "AMEND", rotulo: "Proc. Amend" },
] as const;

export function FiltrosAnalises({
    processo, onProcesso, tipo, onTipo,
    dataInicio, onDataInicio, dataFim, onDataFim,
    busca, onBusca, onLimpar,
}: Props) {
    const [aberto, setAberto] = useState(false);

    // Conta filtros avançados ativos — mostra o badge no botão do mobile
    const ativos = [tipo, dataInicio, dataFim].filter(Boolean).length;

    return (
        <div className="w-full space-y-3">
            {/* Linha principal: processo + busca + toggle de filtros (mobile) */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex overflow-hidden rounded-lg border">
                    {OPCOES_PROCESSO.map((o) => (
                        <button
                            key={o.valor}
                            onClick={() => onProcesso(o.valor)}
                            className={`px-3 py-1.5 text-sm ${processo === o.valor
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            {o.rotulo}
                        </button>
                    ))}
                </div>

                <input
                    type="search"
                    value={busca}
                    onChange={(e) => onBusca(e.target.value)}
                    placeholder="Buscar por título ou lote..."
                    className="min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-xs"
                />

                {/* Toggle visível só no mobile */}
                <button
                    onClick={() => setAberto((a) => !a)}
                    className="relative rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 md:hidden"
                >
                    Filtros
                    {ativos > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                            {ativos}
                        </span>
                    )}
                </button>
            </div>

            {/* Filtros avançados: sempre visíveis no desktop, recolhíveis no mobile */}
            <div className={`${aberto ? "flex" : "hidden"} flex-wrap items-end gap-3 rounded-lg border bg-gray-50 p-3 md:flex`}>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">De</label>
                    <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => onDataInicio(e.target.value)}
                        className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Até</label>
                    <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => onDataFim(e.target.value)}
                        className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Tipo de formulário</label>
                    <select
                        value={tipo}
                        onChange={(e) => onTipo(e.target.value)}
                        className="rounded-lg border bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos os tipos</option>
                        {TIPOS_FORMULARIO.map((t) => (
                            <option key={t.codigo} value={t.codigo}>
                                {t.nome}
                            </option>
                        ))}
                    </select>
                </div>

                {ativos > 0 && (
                    <button
                        onClick={onLimpar}
                        className="rounded-lg px-3 py-1.5 text-sm text-blue-600 hover:underline"
                    >
                        Limpar filtros
                    </button>
                )}
            </div>
        </div>
    );
}