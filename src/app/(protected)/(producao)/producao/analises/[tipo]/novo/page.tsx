// src/app/(producao)/producao/analises/[tipo]/novo/FormularioF3PGI6.tsx
"use client";

import { useMemo, useState } from "react";
import { Combobox, type ComboboxOption } from "@/components/producao/ui/Combobox";
import { salvarAnaliseF3PGI6 } from "@/app/services/producao/analises/[tipo]/novo/F3PGI6";

interface UsuarioLogado {
    nome: string;
    cdUsrTopManager: string | null;
}

interface Props {
    usuario: UsuarioLogado;
    lotes: ComboboxOption[];   // Fase 3: vem de CIONE_LotesSemanais via ERP
    tipos: ComboboxOption[];   // Fase 3: vem de TbObj via ERP
}

// Fórmula do ERP: ((T1+T2+T3)/3)+0.5
function calcularMedia(t1: string, t2: string, t3: string): string {
    const v1 = parseFloat(t1.replace(",", "."));
    const v2 = parseFloat(t2.replace(",", "."));
    const v3 = parseFloat(t3.replace(",", "."));
    if ([v1, v2, v3].some((v) => Number.isNaN(v))) return "—";
    return (((v1 + v2 + v3) / 3) + 0.5).toFixed(2);
}

function parseOpcional(v: string): number | null {
    if (!v.trim()) return null;
    const n = parseFloat(v.replace(",", "."));
    return Number.isNaN(n) ? null : n;
}

export function FormularioF3PGI6({ usuario, lotes, tipos }: Props) {
    const agora = new Date();
    const [data, setData] = useState(agora.toISOString().slice(0, 10));
    const [hora, setHora] = useState(agora.toTimeString().slice(0, 5));
    const [responsavel, setResponsavel] = useState(usuario.cdUsrTopManager ? usuario.nome : "");
    const [loteId, setLoteId] = useState("");
    const [tipoCdObj, setTipoCdObj] = useState("");
    const [amendoa, setAmendoa] = useState({ t1: "", t2: "", t3: "" });
    const [casca, setCasca] = useState({ t1: "", t2: "", t3: "" });
    const [erros, setErros] = useState<Record<string, boolean>>({});
    const [salvando, setSalvando] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [erroGeral, setErroGeral] = useState("");

    const mediaAmendoa = useMemo(() => calcularMedia(amendoa.t1, amendoa.t2, amendoa.t3), [amendoa]);
    const mediaCasca = useMemo(() => calcularMedia(casca.t1, casca.t2, casca.t3), [casca]);

    const vinculado = Boolean(usuario.cdUsrTopManager);

    // Opções do Responsável: o próprio usuário (se vinculado) + lista completa para busca
    const opcoesResponsavel: ComboboxOption[] = [
        ...(vinculado ? [{ valor: usuario.nome, rotulo: `${usuario.nome} (você)` }] : []),
        // Fase 3: buscar a lista de usuários do TopManager (TbUsr) via ERP
        { valor: "Maria Silva", rotulo: "Maria Silva" },
        { valor: "João Souza", rotulo: "João Souza" },
        { valor: "Ana Costa", rotulo: "Ana Costa" },
    ];

    async function salvar() {
        const novosErros: Record<string, boolean> = {
            data: !data,
            responsavel: !responsavel,
            lote: !loteId,
            tipo: !tipoCdObj,
        };
        setErros(novosErros);

        if (Object.values(novosErros).some(Boolean)) return;

        setSalvando(true);
        setErroGeral("");

        const resultado = await salvarAnaliseF3PGI6({
            data,
            hora,
            responsavelCdUsr: usuario.cdUsrTopManager ?? "",
            loteId,
            tipoCdObj,
            amendoa: { t1: parseOpcional(amendoa.t1), t2: parseOpcional(amendoa.t2), t3: parseOpcional(amendoa.t3) },
            casca: { t1: parseOpcional(casca.t1), t2: parseOpcional(casca.t2), t3: parseOpcional(casca.t3) },
        });

        setSalvando(false);

        if (!resultado.ok) {
            setErroGeral(resultado.erro ?? "Erro ao salvar.");
            return;
        }

        setSucesso(true);
        setTimeout(() => setSucesso(false), 4000);
        // Fase 3: redirecionar para /producao após salvar
    }

    function limpar() {
        setData(agora.toISOString().slice(0, 10));
        setHora(agora.toTimeString().slice(0, 5));
        setResponsavel(vinculado ? usuario.nome : "");
        setLoteId("");
        setTipoCdObj("");
        setAmendoa({ t1: "", t2: "", t3: "" });
        setCasca({ t1: "", t2: "", t3: "" });
        setErros({});
        setErroGeral("");
    }

    function BlocoTestes({
        titulo,
        valores,
        onChange,
        media,
    }: {
        titulo: string;
        valores: { t1: string; t2: string; t3: string };
        onChange: (v: { t1: string; t2: string; t3: string }) => void;
        media: string;
    }) {
        return (
            <section className="rounded-xl border bg-white p-4 shadow-sm">
                <h2 className="mb-3 font-semibold text-gray-900">{titulo}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(["t1", "t2", "t3"] as const).map((campo, i) => (
                        <div key={campo}>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Teste {i + 1}</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={valores[campo]}
                                onChange={(e) => onChange({ ...valores, [campo]: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Média</label>
                        <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                            {media}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div className="space-y-4">
            {sucesso && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    ✅ Análise salva no TopManager (simulação — gravação real na Fase 3).
                </div>
            )}
            {erroGeral && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {erroGeral}
                </div>
            )}

            {/* Cabeçalho */}
            <section className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900">Análise F3PGI6</h1>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Proc. Cast
                    </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Data</label>
                        <input
                            type="date"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${erros.data ? "border-red-400" : "border-gray-300"}`}
                        />
                        {erros.data && <p className="mt-1 text-xs text-red-600">Informe a data.</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Hora</label>
                        <input
                            type="time"
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-500">Responsável</label>
                            <span
                                title={vinculado ? "CdUsr do TopManager encontrado — gravação liberada" : "Sem vínculo — selecione da lista"}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${vinculado ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    }`}
                            >
                                {vinculado ? "Vinculado ao TopManager" : "Sem vínculo"}
                            </span>
                        </div>
                        <Combobox
                            opcoes={opcoesResponsavel}
                            valor={responsavel}
                            onChange={setResponsavel}
                            placeholder="Buscar responsável..."
                            erro={erros.responsavel}
                        />
                        {erros.responsavel && <p className="mt-1 text-xs text-red-600">Selecione o responsável.</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Lote Semanal</label>
                        <Combobox
                            opcoes={lotes}
                            valor={loteId}
                            onChange={setLoteId}
                            placeholder="Buscar lote..."
                            erro={erros.lote}
                        />
                        {erros.lote && <p className="mt-1 text-xs text-red-600">Selecione o lote.</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Tipo</label>
                        <Combobox
                            opcoes={tipos}
                            valor={tipoCdObj}
                            onChange={setTipoCdObj}
                            placeholder="Buscar tipo..."
                            erro={erros.tipo}
                        />
                        {erros.tipo && <p className="mt-1 text-xs text-red-600">Selecione o tipo.</p>}
                    </div>
                </div>
            </section>

            {/* Blocos de teste */}
            <BlocoTestes
                titulo="Testes — Amêndoa"
                valores={amendoa}
                onChange={setAmendoa}
                media={mediaAmendoa}
            />
            <BlocoTestes
                titulo="Testes — Casca"
                valores={casca}
                onChange={setCasca}
                media={mediaCasca}
            />

            {/* Ações */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={limpar}
                    className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    onClick={salvar}
                    disabled={salvando}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {salvando ? "Salvando..." : "Salvar Análise"}
                </button>
            </div>
        </div>
    );
}