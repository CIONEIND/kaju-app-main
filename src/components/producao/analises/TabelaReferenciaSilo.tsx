"use client";

import { useMemo, useState } from "react";
import type { TabelaReferencia } from "@/lib/analises/referencia-silo";

const n = (v: number, casas: number) =>
    v.toLocaleString("pt-BR", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
    });

export function TabelaReferenciaSilo({
    tabelas,
    tipoInicial,
}: {
    tabelas: TabelaReferencia[];
    tipoInicial?: string;
}) {
    const tipos = useMemo(
        () => tabelas.map((t) => t.tipoSilo),
        [tabelas],
    );

    const [tipo, setTipo] = useState(
        tipoInicial && tipos.includes(tipoInicial)
            ? tipoInicial
            : (tipos[0] ?? ""),
    );

    const tabela = useMemo(
        () => tabelas.find((t) => t.tipoSilo === tipo) ?? tabelas[0],
        [tabelas, tipo],
    );

    const [silo, setSilo] = useState(tabela?.silos[0]?.cdObj ?? 0);

    /* Ao trocar de tipo, o silo selecionado precisa ser do novo tipo */
    function trocarTipo(novoTipo: string) {
        setTipo(novoTipo);
        const nova = tabelas.find((t) => t.tipoSilo === novoTipo);
        setSilo(nova?.silos[0]?.cdObj ?? 0);
    }

    if (!tabela) {
        return (
            <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
                Nenhum parâmetro de silo cadastrado.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            {/* Cabeçalho escuro, como na planilha */}
            <div className="bg-slate-700 py-2.5 text-center">
                <h2 className="text-base font-semibold tracking-wide text-white">
                    Silos
                </h2>
            </div>

            {/* Identificação */}
            <div className="grid grid-cols-2 border-b border-border bg-slate-100">
                <div className="border-r border-border px-4 py-2">
                    <span className="text-xs font-semibold uppercase text-slate-600">
                        Tipo
                    </span>
                    <select
                        className="mt-0.5 w-full rounded border border-border bg-white px-2 py-1 text-sm font-bold text-slate-900"
                        onChange={(e) => trocarTipo(e.target.value)}
                        value={tipo}
                    >
                        {tipos.map((t) => (
                            <option key={t} value={t}>
                                Tipo {t}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="px-4 py-2">
                    <span className="text-xs font-semibold uppercase text-slate-600">
                        Nº
                    </span>
                    <select
                        className="mt-0.5 w-full rounded border border-border bg-white px-2 py-1 text-sm"
                        onChange={(e) => setSilo(Number(e.target.value))}
                        value={silo}
                    >
                        {tabela.silos.map((s) => (
                            <option key={s.cdObj} value={s.cdObj}>
                                {s.nome}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-slate-200 text-slate-700">
                            <th className="border border-slate-300 px-2 py-1.5" rowSpan={2}>
                                Vazio (m)
                            </th>
                            <th
                                className="border border-slate-300 px-2 py-1 text-xs uppercase"
                                colSpan={3}
                            >
                                Volume (m³)
                            </th>
                            <th
                                className="border border-slate-300 px-2 py-1 text-xs uppercase"
                                colSpan={tabela.pesos.length}
                            >
                                Peso (kg)
                            </th>
                        </tr>
                        <tr className="bg-slate-100 text-slate-600">
                            <th className="border border-slate-300 px-2 py-1">Vᶜ</th>
                            <th className="border border-slate-300 px-2 py-1">Vᵀᶜ</th>
                            <th className="border border-slate-300 px-2 py-1 text-red-700">
                                Vᵀᴼᵀᴬᴸ
                            </th>
                            {tabela.pesos.map((p) => (
                                <th
                                    key={p.tipoAnaliseCdObj}
                                    className="border border-slate-300 px-2 py-1 text-blue-700"
                                    title={`${p.valorKgM3} kg/m³`}
                                >
                                    {p.rotulo}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tabela.linhas.map((l) => (
                            <tr key={l.vazio} className="hover:bg-slate-50">
                                <td className="border border-slate-300 px-2 py-1 text-center font-medium text-blue-700">
                                    {n(l.vazio, 2)}
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-right">
                                    {n(l.volumeCilindro, 2)}
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-right">
                                    {n(l.volumeTronco, 2)}
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-right font-semibold text-red-700">
                                    {n(l.volumeTotal, 2)}
                                </td>
                                {l.pesos.map((p, i) => (
                                    <td
                                        key={i}
                                        className="border border-slate-300 px-2 py-1 text-right text-blue-700"
                                    >
                                        {n(p, 0)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Rodapé com a geometria aplicada */}
            <div className="border-t border-border bg-slate-50 px-4 py-2 text-xs text-slate-600">
                Altura útil: {n(tabela.alturaUtil, 2)} m · Diâmetro:{" "}
                {n(tabela.diametro, 3)} m · Passo: 0,10 m
            </div>
        </div>
    );
}