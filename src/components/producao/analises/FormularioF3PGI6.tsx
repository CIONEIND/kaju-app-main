"use client";

import { Button, useOverlayState } from "@heroui/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
    salvarAnaliseF3PGI6,
    type SalvarAnaliseF3PGI6Input,
} from "@/app/services/producao/analises/salvarAnaliseF3PGI6";
import { CampoNumerico } from "@/components/producao/ui/CampoNumerico";
import { Combobox } from "@/components/producao/ui/Combobox";
import {
    formatarDataBR,
    paraNumero,
    paraTexto,
} from "@/lib/analises/numerico";
import type {
    DadosIniciaisAnalise,
    FormularioBaseProps,
} from "@/lib/analises/tipos";
import { ConfirmarSalvarModal } from "@/components/producao/analises/ConfirmarSalvarModal";
import { useRascunho } from "./useRascunho";

/** Mantidos para não quebrar imports existentes. */
export type AnaliseF3PGI6Inicial = DadosIniciaisAnalise;
export type FormularioF3PGI6Props = FormularioBaseProps;

interface Medicoes {
    t1Amendoa: string;
    t2Amendoa: string;
    t3Amendoa: string;
    t1Casca: string;
    t2Casca: string;
    t3Casca: string;
}

const CAMPOS_AMENDOA = ["t1Amendoa", "t2Amendoa", "t3Amendoa"] as const;
const CAMPOS_CASCA = ["t1Casca", "t2Casca", "t3Casca"] as const;

function hoje(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function agora(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

function media(...textos: string[]): string {
    const nums = textos.map(paraNumero).filter((n): n is number => n !== null);
    if (nums.length === 0) return "—";
    const m = nums.reduce((a, b) => a + b, 0) / nums.length;
    return m.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
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
        <fieldset className="rounded-lg border border-border p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {titulo}
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted">
                        Teste 1
                    </label>
                    <CampoNumerico
                        value={valores[0]}
                        onChange={(v) => onChange(0, v)}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted">
                        Teste 2
                    </label>
                    <CampoNumerico
                        value={valores[1]}
                        onChange={(v) => onChange(1, v)}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted">
                        Teste 3
                    </label>
                    <CampoNumerico
                        value={valores[2]}
                        onChange={(v) => onChange(2, v)}
                    />
                </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Média
                </span>
                <span className="text-sm font-semibold text-foreground">
                    {mediaTexto}
                </span>
            </div>
        </fieldset>
    );
}

export function FormularioF3PGI6({
    modo = "novo",
    tipo = "F3PGI6",
    dadosIniciais,
    usuario,
    lotes,
    tipos,
}: FormularioBaseProps) {
    const router = useRouter();
    const confirmacao = useOverlayState();
    const editando = modo === "editar" && dadosIniciais !== undefined;
    const basePath = `/producao/analises/${tipo}`;

    const [lote, setLote] = useState(
        dadosIniciais?.loteId != null ? String(dadosIniciais.loteId) : "",
    );
    const [tipoId, setTipoId] = useState(
        dadosIniciais?.tipoId != null ? String(dadosIniciais.tipoId) : "",
    );
    const [data, setData] = useState(dadosIniciais?.data ?? hoje());
    const [hora, setHora] = useState(dadosIniciais?.hora ?? agora());

    const [medicoes, setMedicoes] = useState<Medicoes>({
        t1Amendoa: paraTexto(dadosIniciais?.t1Amendoa),
        t2Amendoa: paraTexto(dadosIniciais?.t2Amendoa),
        t3Amendoa: paraTexto(dadosIniciais?.t3Amendoa),
        t1Casca: paraTexto(dadosIniciais?.t1Casca),
        t2Casca: paraTexto(dadosIniciais?.t2Casca),
        t3Casca: paraTexto(dadosIniciais?.t3Casca),
    });

    const [rascunhoId, setRascunhoId] = useState<number | null>(
        dadosIniciais?.id ?? null,
    );
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const semVinculo = usuario.cdUsrTopManager === null;
    const podeRascunhar =
        Boolean(lote) && Boolean(tipoId) && Boolean(data) && !semVinculo;

    function alterarMedicao(campo: keyof Medicoes, valor: string) {
        setMedicoes((prev) => ({ ...prev, [campo]: valor }));
    }

    const { salvando, ultimoSalvo, cancelar } = useRascunho({
        habilitado: podeRascunhar && !editando && !enviando,
        dados: { lote, tipoId, data, hora, medicoes },
        idAtual: rascunhoId,
        salvar: async (d, id) => {
            const r = await salvarAnaliseF3PGI6({
                id: id ?? undefined,
                status: "rascunho",
                data: d.data,
                hora: d.hora || undefined,
                loteId: Number(d.lote),
                tipoId: Number(d.tipoId),
                t1Amendoa: paraNumero(d.medicoes.t1Amendoa),
                t2Amendoa: paraNumero(d.medicoes.t2Amendoa),
                t3Amendoa: paraNumero(d.medicoes.t3Amendoa),
                t1Casca: paraNumero(d.medicoes.t1Casca),
                t2Casca: paraNumero(d.medicoes.t2Casca),
                t3Casca: paraNumero(d.medicoes.t3Casca),
            });
            return r.ok ? { ok: true, id: r.id } : { ok: false, erro: r.erro };
        },
        onId: setRascunhoId,
    });

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErro(null);

        if (!lote) return setErro("Selecione o lote.");
        if (!tipoId) return setErro("Selecione o tipo de análise.");
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

        confirmacao.open();
    }

    async function confirmarSalvar() {
        cancelar();
        setEnviando(true);
        try {
            const input: SalvarAnaliseF3PGI6Input = {
                id: rascunhoId ?? undefined,
                status: "concluida",
                data,
                hora: hora || undefined,
                loteId: Number(lote),
                tipoId: Number(tipoId),
                t1Amendoa: paraNumero(medicoes.t1Amendoa),
                t2Amendoa: paraNumero(medicoes.t2Amendoa),
                t3Amendoa: paraNumero(medicoes.t3Amendoa),
                t1Casca: paraNumero(medicoes.t1Casca),
                t2Casca: paraNumero(medicoes.t2Casca),
                t3Casca: paraNumero(medicoes.t3Casca),
            };

            const resultado = await salvarAnaliseF3PGI6(input);
            if (!resultado.ok) {
                confirmacao.close();
                setErro(resultado.erro);
                return;
            }

            router.push(basePath);
            router.refresh();
        } finally {
            setEnviando(false);
        }
    }

    function handleLimpar() {
        setLote("");
        setTipoId("");
        setData(hoje());
        setHora(agora());
        setMedicoes({
            t1Amendoa: "",
            t2Amendoa: "",
            t3Amendoa: "",
            t1Casca: "",
            t2Casca: "",
            t3Casca: "",
        });
        setRascunhoId(null);
        setErro(null);
    }

    const resumo = [
        {
            label: "Lote",
            valor: lotes.find((l) => l.valor === lote)?.rotulo ?? "—",
        },
        {
            label: "Tipo",
            valor: tipos.find((t) => t.valor === tipoId)?.rotulo ?? "—",
        },
        {
            label: "Data",
            valor: `${formatarDataBR(data)}${hora ? ` · ${hora}` : ""}`,
        },
        {
            label: "Média amêndoa",
            valor: media(
                medicoes.t1Amendoa,
                medicoes.t2Amendoa,
                medicoes.t3Amendoa,
            ),
        },
        {
            label: "Média casca",
            valor: media(medicoes.t1Casca, medicoes.t2Casca, medicoes.t3Casca),
        },
    ];

    const campoData =
        "w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-base outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm";

    return (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                <button
                    aria-label="Voltar para a central"
                    className="rounded-md p-1.5 text-muted hover:bg-surface-secondary hover:text-foreground"
                    onClick={() => router.push(basePath)}
                    type="button"
                >
                    <ArrowLeft size={18} />
                </button>

                <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-foreground">
                        {editando ? "Editar análise — F3PGI6" : "Nova análise — F3PGI6"}
                    </h2>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
                        <span>
                            Responsável:{" "}
                            <span className="font-medium text-foreground">{usuario.nome}</span>
                        </span>
                        {!editando && (
                            <span className="inline-flex items-center gap-1 text-xs">
                                {salvando ? (
                                    <>
                                        <Loader2 className="size-3 animate-spin" />
                                        Salvando rascunho…
                                    </>
                                ) : ultimoSalvo ? (
                                    `Rascunho salvo às ${ultimoSalvo.toLocaleTimeString("pt-BR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}`
                                ) : podeRascunhar ? (
                                    "Rascunho automático ativo"
                                ) : (
                                    ""
                                )}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {semVinculo && (
                <div className="mx-6 mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Seu usuário não está vinculado a um CdUsr do TopManager.
                </div>
            )}

            {erro && (
                <div className="mx-6 mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {erro}
                </div>
            )}

            <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Lote *
                        </label>
                        <Combobox
                            erro={erro !== null && lote === ""}
                            onChange={setLote}
                            opcoes={lotes}
                            placeholder="Selecionar lote..."
                            valor={lote}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Tipo de análise *
                        </label>
                        <Combobox
                            erro={erro !== null && tipoId === ""}
                            onChange={setTipoId}
                            opcoes={tipos}
                            placeholder="Selecionar tipo..."
                            valor={tipoId}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Data da análise *
                        </label>
                        <input
                            className={campoData}
                            onChange={(e) => setData(e.target.value)}
                            type="date"
                            value={data}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Hora
                        </label>
                        <input
                            className={campoData}
                            onChange={(e) => setHora(e.target.value)}
                            type="time"
                            value={hora}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <GrupoMedicoes
                        mediaTexto={media(
                            medicoes.t1Amendoa,
                            medicoes.t2Amendoa,
                            medicoes.t3Amendoa,
                        )}
                        onChange={(i, v) => alterarMedicao(CAMPOS_AMENDOA[i], v)}
                        titulo="Amêndoa"
                        valores={[
                            medicoes.t1Amendoa,
                            medicoes.t2Amendoa,
                            medicoes.t3Amendoa,
                        ]}
                    />

                    <GrupoMedicoes
                        mediaTexto={media(
                            medicoes.t1Casca,
                            medicoes.t2Casca,
                            medicoes.t3Casca,
                        )}
                        onChange={(i, v) => alterarMedicao(CAMPOS_CASCA[i], v)}
                        titulo="Casca"
                        valores={[medicoes.t1Casca, medicoes.t2Casca, medicoes.t3Casca]}
                    />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                    <Button
                        onPress={() =>
                            editando ? router.push(basePath) : handleLimpar()
                        }
                        variant="secondary"
                    >
                        {editando ? "Cancelar" : "Limpar"}
                    </Button>
                    <Button
                        isDisabled={enviando || semVinculo}
                        type="submit"
                        variant="primary"
                    >
                        {enviando ? "Salvando..." : "Salvar análise"}
                    </Button>
                </div>
            </form>

            <ConfirmarSalvarModal
                editando={editando}
                enviando={enviando}
                onConfirmar={confirmarSalvar}
                resumo={resumo}
                state={confirmacao}
            />
        </div>
    );
}