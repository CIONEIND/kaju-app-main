// src/app/(producao)/producao/components/ListaAnalises.tsx
"use client";

import { useMemo, useState } from "react";
import { ANALISES_MOCK } from "./mock-analises";
import type { Analise, Processo } from "@/app/(protected)/(producao)/producao/types";
import { CardAnalise } from "./CardAnalise";
import { FiltrosAnalises } from "./FiltrosAnalises";
import { ModalNovaAnalise } from "./ModalNovaAnalise";

type FiltroProcesso = "TODOS" | Processo;

export function ListaAnalises({ podeEditar, podeExcluir }: { podeEditar: boolean; podeExcluir: boolean }) {
    const [analises, setAnalises] = useState<Analise[]>(ANALISES_MOCK);
    const [processo, setProcesso] = useState<FiltroProcesso>("TODOS");
    const [busca, setBusca] = useState("");
    const [modalAberto, setModalAberto] = useState(false);

    const filtradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return analises.filter((a) => {
            const bateProcesso = processo === "TODOS" || a.processo === processo;
            const bateBusca =
                !termo || a.tipoNome.toLowerCase().includes(termo) || a.lote.toLowerCase().includes(termo);
            return bateProcesso && bateBusca;
        });
    }, [analises, processo, busca]);

    function excluir(id: string) {
        // Fase 2/3: vira server action que grava no TopManager
        setAnalises((atual) => atual.filter((a) => a.id !== id));
    }

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <FiltrosAnalises processo={processo} onProcesso={setProcesso} busca={busca} onBusca={setBusca} />
                <button
                    onClick={() => setModalAberto(true)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Nova Análise +
                </button>
            </div>

            {filtradas.length === 0 ? (
                <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
                    Nenhuma análise encontrada para os filtros selecionados.
                </p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtradas.map((a) => (
                        <CardAnalise
                            key={a.id}
                            analise={a}
                            podeEditar={podeEditar}
                            podeExcluir={podeExcluir}
                            onExcluir={excluir}
                        />
                    ))}
                </div>
            )}

            <ModalNovaAnalise aberto={modalAberto} onFechar={() => setModalAberto(false)} />
        </section>
    );
}