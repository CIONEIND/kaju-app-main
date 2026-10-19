"use client";

import { useEffect, useMemo, useState } from "react";
import { ANALISES_MOCK } from "@/mocks/mock-analises";
import type { Analise, Processo } from "@/app/(protected)/(producao)/producao/types";
import { CardAnalise } from "./CardAnalise";
import { FiltrosAnalises } from "./FiltrosAnalises";
import { ModalNovaAnalise } from "./ModalNovaAnalise";
import { Paginacao } from "./Paginacao"

const ITENS_POR_PAGINA = 6; // 3x2 no desktop, 1 coluna no mobile
type FiltroProcesso = "TODOS" | Processo;

export function ListaAnalises({ podeEditar, podeExcluir }: { podeEditar: boolean; podeExcluir: boolean }) {
    const [analises, setAnalises] = useState<Analise[]>(ANALISES_MOCK);
    const [processo, setProcesso] = useState<FiltroProcesso>("TODOS");
    const [tipo, setTipo] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [busca, setBusca] = useState("");
    const [pagina, setPagina] = useState(1);
    const [modalAberto, setModalAberto] = useState(false);

    // Qualquer mudança de filtro volta para a primeira página
    useEffect(() => {
        setPagina(1);
    }, [processo, tipo, dataInicio, dataFim, busca]);

    const filtradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return analises.filter((a) => {
            const dia = a.dataHora.slice(0, 10); // ISO "YYYY-MM-DD" — comparação de string funciona
            const bateProcesso = processo === "TODOS" || a.processo === processo;
            const bateTipo = !tipo || a.tipoCodigo === tipo;
            const batePeriodo = (!dataInicio || dia >= dataInicio) && (!dataFim || dia <= dataFim);
            const bateBusca =
                !termo || a.tipoNome.toLowerCase().includes(termo) || a.lote.toLowerCase().includes(termo);
            return bateProcesso && bateTipo && batePeriodo && bateBusca;
        });
    }, [analises, processo, tipo, dataInicio, dataFim, busca]);

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
    const paginadas = filtradas.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

    function excluir(id: string) {
        // Fase 2/3: vira server action que grava no TopManager
        setAnalises((atual) => atual.filter((a) => a.id !== id));
    }

    function limparFiltros() {
        setTipo("");
        setDataInicio("");
        setDataFim("");
    }

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <FiltrosAnalises
                    processo={processo} onProcesso={setProcesso}
                    tipo={tipo} onTipo={setTipo}
                    dataInicio={dataInicio} onDataInicio={setDataInicio}
                    dataFim={dataFim} onDataFim={setDataFim}
                    busca={busca} onBusca={setBusca}
                    onLimpar={limparFiltros}
                />
                <button
                    onClick={() => setModalAberto(true)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Nova Análise +
                </button>
            </div>

            <p className="text-sm text-gray-500">
                {filtradas.length} análise{filtradas.length !== 1 && "s"} encontrada{filtradas.length !== 1 && "s"}
            </p>

            {filtradas.length === 0 ? (
                <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
                    Nenhuma análise encontrada para os filtros selecionados.
                </p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {paginadas.map((a) => (
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

            <Paginacao pagina={pagina} totalPaginas={totalPaginas} onPagina={setPagina} />

            <ModalNovaAnalise aberto={modalAberto} onFechar={() => setModalAberto(false)} />
        </section>
    );
}