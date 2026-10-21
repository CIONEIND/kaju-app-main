"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
    salvarAnaliseF3PGI6,
    type SalvarAnaliseF3PGI6Input,
} from "@/app/services/producao/analises/salvarAnaliseF3PGI6";
import { Combobox } from "@/components/producao/ui/Combobox";

/** Forma como a análise chega do banco (modo editar) */
export interface AnaliseF3PGI6Inicial {
    id: number;
    data: string; // "YYYY-MM-DD"
    hora: string; // "HH:mm"
    loteId: number | null;
    tipoId: number | null;
    t1Amendoa: number | null;
    t2Amendoa: number | null;
    t3Amendoa: number | null;
    t1Casca: number | null;
    t2Casca: number | null;
    t3Casca: number | null;
}

export interface FormularioF3PGI6Props {
    modo?: "novo" | "editar";
    dadosIniciais?: AnaliseF3PGI6Inicial;
    usuario: { nome: string; cdUsrTopManager: number | null };
    lotes: { valor: string; rotulo: string }[];
    tipos: { valor: string; rotulo: string }[];
}

interface Medicoes {
    t1Amendoa: string;
    t2Amendoa: string;
    t3Amendoa: string;
    t1Casca: string;
    t2Casca: string;
    t3Casca: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hoje(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function agoraHora(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function textoDe(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? "" : String(valor);
}

/** Aceita "12,5" e "12.5"; devolve null se vazio ou inválido */
function paraNumero(texto: string): number | null {
    const limpo = texto.trim().replace(",", ".");
    if (limpo === "") return null;
    const n = Number(limpo);
    return Number.isFinite(n) ? n : null;
}

/** Média das 3 medições, 2 casas; "—" se alguma estiver vazia */
function media(a: string, b: string, c: string): string {
    const nums = [paraNumero(a), paraNumero(b), paraNumero(c)];
    if (nums.some((n) => n === null)) return "—";
    const soma = (nums[0] as number) + (nums[1] as number) + (nums[2] as number);
    return (soma / 3).toFixed(2);
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────
function CampoMedicao({
    label,
    valor,
    onChange,
}: {
    label: string;
    valor: string;
    onChange: (v: string) => void;
}) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
                {label}
            </label>
            <input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}

function GrupoMedicoes({
    titulo,
    valores,
    onChange,
    mediaTexto,
}: {
    titulo: string;
    valores: [string, string, string];
    onChange: (indice: 0 | 1 | 2, valor: string) => void;
    mediaTexto: string;
}) {
    return (
        <fieldset className="rounded-lg border border-gray-200 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {titulo}
            </legend>
            <div className="grid grid-cols-3 gap-3">
                <CampoMedicao
                    label="Teste 1"
                    valor={valores[0]}
                    onChange={(v) => onChange(0, v)}
                />
                <CampoMedicao
                    label="Teste 2"
                    valor={valores[1]}
                    onChange={(v) => onChange(1, v)}
                />
                <CampoMedicao
                    label="Teste 3"
                    valor={valores[2]}
                    onChange={(v) => onChange(2, v)}
                />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Média
                </span>
                <span className="text-sm font-semibold text-gray-900">{mediaTexto}</span>
            </div>
        </fieldset>
    );
}

// ─── Componente principal ────────────────────────────────────────────────────
export function FormularioF3PGI6({
    modo = "novo",
    dadosIniciais,
    usuario,
    lotes,
    tipos,
}: FormularioF3PGI6Props) {
    const router = useRouter();
    const editando = modo === "editar" && dadosIniciais !== undefined;

    const [lote, setLote] = useState(
        dadosIniciais?.loteId != null ? String(dadosIniciais.loteId) : "",
    );
    const [tipo, setTipo] = useState(
        dadosIniciais?.tipoId != null ? String(dadosIniciais.tipoId) : "",
    );
    const [data, setData] = useState(dadosIniciais?.data ?? hoje());
    const [hora, setHora] = useState(dadosIniciais?.hora ?? agoraHora());

    const [medicoes, setMedicoes] = useState<Medicoes>({
        t1Amendoa: textoDe(dadosIniciais?.t1Amendoa),
        t2Amendoa: textoDe(dadosIniciais?.t2Amendoa),
        t3Amendoa: textoDe(dadosIniciais?.t3Amendoa),
        t1Casca: textoDe(dadosIniciais?.t1Casca),
        t2Casca: textoDe(dadosIniciais?.t2Casca),
        t3Casca: textoDe(dadosIniciais?.t3Casca),
    });

    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const semVinculo = usuario.cdUsrTopManager === null;

    function alterarMedicao(campo: keyof Medicoes, valor: string) {
        setMedicoes((prev) => ({ ...prev, [campo]: valor }));
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErro(null);

        if (!lote) return setErro("Selecione o lote.");
        if (!tipo) return setErro("Selecione o tipo de análise.");
        if (!data) return setErro("Informe a data da análise.");
        if (semVinculo) {
            return setErro(
                "Usuário sem vínculo com o TopManager — contate o administrador.",
            );
        }

        const medidos = Object.values(medicoes).filter((v) => v.trim() !== "");
        if (medidos.length === 0) {
            return setErro("Informe ao menos uma medição (amêndoa ou casca).");
        }

        setEnviando(true);
        try {
            const input: SalvarAnaliseF3PGI6Input = {
                id: editando ? dadosIniciais.id : undefined,
                data,
                hora: hora || undefined,
                loteId: Number(lote),
                tipoId: Number(tipo),
                t1Amendoa: paraNumero(medicoes.t1Amendoa),
                t2Amendoa: paraNumero(medicoes.t2Amendoa),
                t3Amendoa: paraNumero(medicoes.t3Amendoa),
                t1Casca: paraNumero(medicoes.t1Casca),
                t2Casca: paraNumero(medicoes.t2Casca),
                t3Casca: paraNumero(medicoes.t3Casca),
            };

            const resultado = await salvarAnaliseF3PGI6(input);
            if (!resultado.ok) {
                setErro(resultado.erro);
                return;
            }

            router.push(`/producao/analises/F3PGI6/${resultado.id}`);
        } finally {
            setEnviando(false);
        }
    }

    function handleLimpar() {
        setLote("");
        setTipo("");
        setData(hoje());
        setHora(agoraHora());
        setMedicoes({
            t1Amendoa: "",
            t2Amendoa: "",
            t3Amendoa: "",
            t1Casca: "",
            t2Casca: "",
            t3Casca: "",
        });
        setErro(null);
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    {editando ? "Editar análise — F3PGI6" : "Nova análise — F3PGI6"}
                </h2>
                <p className="text-sm text-gray-500">
                    Responsável:{" "}
                    <span className="font-medium text-gray-700">{usuario.nome}</span>
                    {usuario.cdUsrTopManager !== null && (
                        <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            CdUsr {usuario.cdUsrTopManager}
                        </span>
                    )}
                </p>
            </div>

            {semVinculo && (
                <div className="mx-6 mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Seu usuário ainda não está vinculado a um código TopManager (CdUsr).
                    Peça ao administrador para fazer o vínculo no painel de usuários antes
                    de registrar análises.
                </div>
            )}

            {erro && (
                <div className="mx-6 mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {erro}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Lote *
                        </label>
                        <Combobox
                            opcoes={lotes}
                            valor={lote}
                            onChange={setLote}
                            placeholder="Selecionar lote..."
                            erro={erro !== null && lote === ""}
                        />
                    </div>

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

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Hora
                        </label>
                        <input
                            type="time"
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <GrupoMedicoes
                        titulo="Amêndoa"
                        valores={[
                            medicoes.t1Amendoa,
                            medicoes.t2Amendoa,
                            medicoes.t3Amendoa,
                        ]}
                        onChange={(i, v) =>
                            alterarMedicao(
                                (["t1Amendoa", "t2Amendoa", "t3Amendoa"] as const)[i],
                                v,
                            )
                        }
                        mediaTexto={media(
                            medicoes.t1Amendoa,
                            medicoes.t2Amendoa,
                            medicoes.t3Amendoa,
                        )}
                    />

                    <GrupoMedicoes
                        titulo="Casca"
                        valores={[medicoes.t1Casca, medicoes.t2Casca, medicoes.t3Casca]}
                        onChange={(i, v) =>
                            alterarMedicao(
                                (["t1Casca", "t2Casca", "t3Casca"] as const)[i],
                                v,
                            )
                        }
                        mediaTexto={media(
                            medicoes.t1Casca,
                            medicoes.t2Casca,
                            medicoes.t3Casca,
                        )}
                    />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={() => {
                            if (editando) {
                                router.push(`/producao/analises/F3PGI6/${dadosIniciais.id}`);
                            } else {
                                handleLimpar();
                            }
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {editando ? "Cancelar" : "Limpar"}
                    </button>
                    <button
                        type="submit"
                        disabled={enviando || semVinculo}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {enviando ? "Salvando..." : "Salvar Análise"}
                    </button>
                </div>
            </form>
        </div>
    );
}