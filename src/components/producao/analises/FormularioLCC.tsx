"use client";

import { Button, useOverlayState } from "@heroui/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
    salvarAnaliseLCC,
    type SalvarAnaliseLCCInput,
} from "@/app/services/producao/analises/salvarAnaliseLCC";
import { CampoNumerico } from "@/components/producao/ui/CampoNumerico";
import { Combobox } from "@/components/producao/ui/Combobox";
import {
    formatarDataBR,
    paraNumero,
    paraTexto,
} from "@/lib/analises/numerico";
import type { FormularioBaseProps } from "@/lib/analises/tipos";
import { ConfirmarSalvarModal } from "./ConfirmarSalvarModal";
import { useRascunho } from "./useRascunho";

/**
 * MESMA fórmula do banco (FORMULA_RESULTADO_SQL).
 * Se mudar no SQL, mude aqui — ou o preview diverge do card.
 */
export function calcularResultado(
    altura: number | null,
    temperatura: number | null,
): number | null {
    if (altura === null || temperatura === null) return null;
    return altura * Math.PI * 2.25 * 1000 * (0.96 - (temperatura - 25) * 0.00069);
}

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

function formatarNumero(v: number | null): string {
    if (v === null) return "—";
    return v.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function FormularioLCC({
    modo = "novo",
    tipo = "LCC",
    dadosIniciais,
    usuario,
    lotes,
    origens = [],
}: FormularioBaseProps) {
    const router = useRouter();
    const confirmacao = useOverlayState();
    const editando = modo === "editar" && dadosIniciais !== undefined;
    const basePath = `/producao/analises/${tipo}`;

    const [lote, setLote] = useState(
        dadosIniciais?.loteId != null ? String(dadosIniciais.loteId) : "",
    );
    const [origem, setOrigem] = useState(
        dadosIniciais?.origemId != null ? String(dadosIniciais.origemId) : "",
    );
    const [data, setData] = useState(dadosIniciais?.data ?? hoje());
    const [hora, setHora] = useState(dadosIniciais?.hora ?? agora());
    const [viscosidade, setViscosidade] = useState(
        paraTexto(dadosIniciais?.viscosidade),
    );
    const [altura, setAltura] = useState(paraTexto(dadosIniciais?.altura));
    const [temperatura, setTemperatura] = useState(
        paraTexto(dadosIniciais?.temperatura),
    );

    const [rascunhoId, setRascunhoId] = useState<number | null>(
        dadosIniciais?.id ?? null,
    );
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const semVinculo = usuario.cdUsrTopManager === null;
    const podeRascunhar =
        Boolean(lote) && Boolean(origem) && Boolean(data) && !semVinculo;

    // Preview do resultado, exatamente como o banco vai calcular
    const resultadoPrevisto = useMemo(
        () => calcularResultado(paraNumero(altura), paraNumero(temperatura)),
        [altura, temperatura],
    );

    const { salvando, ultimoSalvo, cancelar } = useRascunho({
        habilitado: podeRascunhar && !editando && !enviando,
        dados: { lote, origem, data, hora, viscosidade, altura, temperatura },
        idAtual: rascunhoId,
        salvar: async (d, id) => {
            const r = await salvarAnaliseLCC({
                id: id ?? undefined,
                status: "rascunho",
                data: d.data,
                hora: d.hora || undefined,
                responsavelCdUsr: usuario.cdUsrTopManager as number,
                loteId: Number(d.lote),
                origemId: Number(d.origem),
                viscosidade: paraNumero(d.viscosidade),
                altura: paraNumero(d.altura),
                temperatura: paraNumero(d.temperatura),
            });
            return r.ok ? { ok: true, id: r.id } : { ok: false, erro: r.erro };
        },
        onId: setRascunhoId,
    });

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErro(null);

        if (!lote) return setErro("Selecione o lote.");
        if (!origem) return setErro("Selecione a origem.");
        if (!data) return setErro("Informe a data da análise.");
        if (semVinculo) return setErro("Usuário sem vínculo com o TopManager.");

        confirmacao.open();
    }

    async function confirmarSalvar() {
        cancelar();
        setEnviando(true);
        try {
            const input: SalvarAnaliseLCCInput = {
                id: rascunhoId ?? undefined,
                status: "concluida",
                data,
                hora: hora || undefined,
                responsavelCdUsr: usuario.cdUsrTopManager as number,
                loteId: Number(lote),
                origemId: Number(origem),
                viscosidade: paraNumero(viscosidade),
                altura: paraNumero(altura),
                temperatura: paraNumero(temperatura),
            };

            const r = await salvarAnaliseLCC(input);
            if (!r.ok) {
                confirmacao.close();
                setErro(r.erro);
                return;
            }

            router.push(basePath);
            router.refresh();
        } finally {
            setEnviando(false);
        }
    }

    function limpar() {
        setLote("");
        setOrigem("");
        setData(hoje());
        setHora(agora());
        setViscosidade("");
        setAltura("");
        setTemperatura("");
        setRascunhoId(null);
        setErro(null);
    }

    const resumo = [
        {
            label: "Lote",
            valor: lotes.find((l) => l.valor === lote)?.rotulo ?? "—",
        },
        {
            label: "Origem",
            valor: origens.find((o) => o.valor === origem)?.rotulo ?? "—",
        },
        {
            label: "Data",
            valor: `${formatarDataBR(data)}${hora ? ` · ${hora}` : ""}`,
        },
        { label: "Viscosidade", valor: viscosidade || "—" },
        { label: "Altura", valor: altura || "—" },
        { label: "Temperatura", valor: temperatura || "—" },
        { label: "Resultado", valor: formatarNumero(resultadoPrevisto) },
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
                        {editando ? "Editar análise — LCC" : "Nova análise — LCC"}
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
                            onChange={setLote}
                            opcoes={lotes}
                            placeholder="Selecionar lote..."
                            valor={lote}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Origem *
                        </label>
                        <Combobox
                            onChange={setOrigem}
                            opcoes={origens}
                            placeholder="Selecionar origem..."
                            valor={origem}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Data *
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

                <fieldset className="rounded-lg border border-border p-4">
                    <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                        Medições
                    </legend>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted">
                                Viscosidade
                            </label>
                            <CampoNumerico onChange={setViscosidade} value={viscosidade} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted">
                                Altura
                            </label>
                            <CampoNumerico onChange={setAltura} value={altura} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted">
                                Temperatura
                            </label>
                            <CampoNumerico onChange={setTemperatura} value={temperatura} />
                        </div>
                    </div>
                </fieldset>

                <div className="flex items-center justify-between rounded-lg bg-surface-secondary px-4 py-3">
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                            Resultado (calculado)
                        </p>
                        <p className="text-xs text-muted">
                            Altura × π × 2,25 × 1000 × correção de temperatura
                        </p>
                    </div>
                    <p className="text-xl font-semibold text-foreground">
                        {formatarNumero(resultadoPrevisto)}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                    <Button
                        onPress={() => (editando ? router.push(basePath) : limpar())}
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