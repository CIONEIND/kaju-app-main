// src/app/(producao)/producao/components/FiltrosAnalises.tsx
"use client";

import type { Processo } from "@/app/(protected)/(producao)/producao/types";

interface Props {
    processo: "TODOS" | Processo;
    onProcesso: (p: "TODOS" | Processo) => void;
    busca: string;
    onBusca: (b: string) => void;
}

const OPCOES = [
    { valor: "TODOS", rotulo: "Todos" },
    { valor: "CAST", rotulo: "Proc. Cast" },
    { valor: "AMEND", rotulo: "Proc. Amend" },
] as const;

export function FiltrosAnalises({ processo, onProcesso, busca, onBusca }: Props) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex overflow-hidden rounded-lg border">
                {OPCOES.map((o) => (
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
                className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}