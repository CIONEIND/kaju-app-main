// src/app/(producao)/producao/analises/[tipo]/novo/FormularioF3PGI6.tsx
"use client";

import { useMemo, useState } from "react";
import { Combobox, type ComboboxOption } from "@/components/producao/ui/Combobox";
import { salvarAnaliseF3PGI6, SalvarAnaliseF3PGI6Input } from "@/app/services/producao/analises/salvarAnaliseF3PGI6";



export interface FormularioF3PGI6Props {
    /** Usuário logado — só para exibir o responsável; o CdUsr é lido pela action no servidor */
    usuario: {
        nome: string;
        cdUsrTopManager: number | null;
    };
    /** Lotes disponíveis: valor = código no ERP, rotulo = exibição */
    lotes: { valor: string; rotulo: string }[];
    /** Tipos de análise disponíveis */
    tipos: { valor: string; rotulo: string }[];
}

type Status = "aprovado" | "reprovado" | "pendente";

function hojeISO() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function FormularioF3PGI6({ usuario, lotes, tipos }: FormularioF3PGI6Props) {
    const [lote, setLote] = useState("");
    const [tipo, setTipo] = useState("");
    const [data, setData] = useState(hojeISO());
    const [hora, setHora] = useState("");
    const [status, setStatus] = useState<Status>("aprovado");
    const [observacoes, setObservacoes] = useState("");

    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState(false);

    const semVinculo = usuario.cdUsrTopManager === null;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErro(null);
        setSucesso(false);

        if (!lote) return setErro("Selecione o lote.");
        if (!tipo) return setErro("Selecione o tipo de análise.");
        if (!data) return setErro("Informe a data da análise.");
        if (semVinculo)
            return setErro("Usuário sem vínculo com o TopManager — contate o administrador.");

        setEnviando(true);
        try {
            const input: SalvarAnaliseF3PGI6Input = {
                lote,
                tipoAnalise: tipo,
                dataAnalise: data,
                horaAnalise: hora || undefined,
                resultado: status,
                observacoes: observacoes.trim() || undefined,
            };
            const resultado = await salvarAnaliseF3PGI6(input);
            if (!resultado.ok) {
                setErro(resultado.erro);
                return;
            }
            setSucesso(true);
            setLote("");
            setTipo("");
            setObservacoes("");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Cabeçalho */}
            <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Nova análise — F3PGI6</h2>
                <p className="text-sm text-gray-500">
                    Responsável: <span className="font-medium text-gray-700">{usuario.nome}</span>
                    {usuario.cdUsrTopManager !== null && (
                        <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            CdUsr {usuario.cdUsrTopManager}
                        </span>
                    )}
                </p>
            </div>

            {semVinculo && (
                <div className="mx-6 mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Seu usuário ainda não está vinculado a um código TopManager (CdUsr). Peça ao
                    administrador para fazer o vínculo no painel de usuários antes de registrar análises.
                </div>
            )}

            {sucesso && (
                <div className="mx-6 mt-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
                    Análise registrada com sucesso.
                </div>
            )}

            {erro && (
                <div className="mx-6 mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {erro}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Lote */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Lote *</label>
                        <Combobox
                            opcoes={lotes}
                            valor={lote}
                            onChange={setLote}
                            placeholder="Selecionar lote..."
                            erro={erro !== null && lote === ""}
                        />
                    </div>

                    {/* Tipo de análise */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Tipo de análise *
                        </label>
                        <Combobox
                            opcoes={tipos}
                            valor={tipo}
                            onChange={setTipo}
                            placeholder="Selecionar tipo..."
                            erro={erro !== null && tipo === ""}
                        />
                    </div>

                    {/* Data */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Data da análise *
                        </label>
                        <input
                            type="date"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Hora */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Hora <span className="text-gray-400">(opcional)</span>
                        </label>
                        <input
                            type="time"
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Resultado */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Resultado *</label>
                    <div className="flex flex-wrap gap-2">
                        {(["aprovado", "reprovado", "pendente"] as const).map((opcao) => (
                            <button
                                key={opcao}
                                type="button"
                                onClick={() => setStatus(opcao)}
                                className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${status === opcao
                                    ? opcao === "aprovado"
                                        ? "border-green-500 bg-green-50 text-green-700"
                                        : opcao === "reprovado"
                                            ? "border-red-500 bg-red-50 text-red-700"
                                            : "border-amber-500 bg-amber-50 text-amber-700"
                                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {opcao}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Observações */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Observações <span className="text-gray-400">(opcional)</span>
                    </label>
                    <textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        rows={4}
                        placeholder="Laudo, parâmetros medidos, não conformidades..."
                        className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Ações */}
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={() => {
                            setLote("");
                            setTipo("");
                            setObservacoes("");
                            setErro(null);
                            setSucesso(false);
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Limpar
                    </button>
                    <button
                        type="submit"
                        disabled={enviando || semVinculo}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {enviando ? "Salvando..." : "Registrar análise"}
                    </button>
                </div>
            </form>
        </div>
    );
}