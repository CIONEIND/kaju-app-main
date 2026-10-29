"use client";

import { Button, useOverlayState } from "@heroui/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
    salvarAnaliseF6PGI6,
    type SalvarAnaliseF6PGI6Input,
} from "@/app/services/producao/analises/salvarAnaliseF6PGI6";
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

interface Medicoes {
    cubagem: string;
    consumo: string;
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

export function FormularioF6PGI6({
    modo = "novo",
    tipo = "F6PGI6",
    dadosIniciais,
    usuario,
    lotes,
    tipos,
    silos = [],
}: FormularioBaseProps) {
    const router = useRouter();
    const confirmacao = useOverlayState();
    const editando = modo === "editar" && dadosIniciais !== undefined;
    const basePath = `/producao/analises/${tipo}`;

    const [lote, setLote] = useState(
        dadosIniciais?.loteId != null ? String(dadosIniciais.loteId) : "",
    );
    const [silo, setSilo] = useState(
        dadosIniciais?.siloId != null ? String(dadosIniciais.siloId) : "",
    );
    const [tipoId, setTipoId] = useState(
        dadosIniciais?.tipoId != null ? String(dadosIniciais.tipoId) : "",
    );
    const [data, setData] = useState(dadosIniciais?.data ?? hoje());
    const [hora, setHora] = useState(dadosIniciais?.hora ?? agora());

    const [medicoes, setMedicoes] = useState<Medicoes>({
        cubagem: paraTexto(dadosIniciais?.cubagem),
        consumo: paraTexto(dadosIniciais?.consumo),
    });

    const [rascunhoId, setRascunhoId] = useState<number | null>(
        dadosIniciais?.id ?? null,
    );
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const semVinculo = usuario.cdUsrTopManager === null;
    const podeRascunhar =
        Boolean(lote) && Boolean(silo) && Boolean(tipoId) && Boolean(data) && !semVinculo;

    const { salvando, ultimoSalvo, cancelar } = useRascunho({
        habilitado: podeRascunhar && !editando && !enviando,
        dados: { lote, silo, tipoId, data, hora, medicoes },
        idAtual: rascunhoId,
        salvar: async (d, id) => {
            const r = await salvarAnaliseF6PGI6({
                id: id ?? undefined,
                status: "rascunho",
                data: d.data,
                hora: d.hora || undefined,
                responsavelCdUsr: usuario.cdUsrTopManager as number,
                loteId: Number(d.lote),
                siloId: Number(d.silo),
                tipoId: Number(d.tipoId),
                cubagem: paraNumero(d.medicoes.cubagem),
                consumo: paraNumero(d.medicoes.consumo),
            });
            return r.ok ? { ok: true, id: r.id } : { ok: false, erro: r.erro };
        },
        onId: setRascunhoId,
    });

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErro(null);

        if (!lote) return setErro("Selecione o lote.");
        if (!silo) return setErro("Selecione o silo.");
        if (!tipoId) return setErro("Selecione o tipo.");
        if (!data) return setErro("Informe a data da análise.");
        if (semVinculo) return setErro("Usuário sem vínculo com o TopManager.");

        confirmacao.open();
    }

    async function confirmarSalvar() {
        cancelar();
        setEnviando(true);
        try {
            const input: SalvarAnaliseF6PGI6Input = {
                id: rascunhoId ?? undefined,
                status: "concluida",
                data,
                hora: hora || undefined,
                responsavelCdUsr: usuario.cdUsrTopManager as number,
                loteId: Number(lote),
                siloId: Number(silo),
                tipoId: Number(tipoId),
                cubagem: paraNumero(medicoes.cubagem),
                consumo: paraNumero(medicoes.consumo),
            };

            const r = await salvarAnaliseF6PGI6(input);
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
        setSilo("");
        setTipoId("");
        setData(hoje());
        setHora(agora());
        setMedicoes({ cubagem: "", consumo: "" });
        setRascunhoId(null);
        setErro(null);
    }

    const resumo = [
        {
            label: "Lote",
            valor: lotes.find((l) => l.valor === lote)?.rotulo ?? "—",
        },
        {
            label: "Silo",
            valor: silos.find((s) => s.valor === silo)?.rotulo ?? "—",
        },
        {
            label: "Tipo",
            valor: tipos.find((t) => t.valor === tipoId)?.rotulo ?? "—",
        },
        {
            label: "Data",
            valor: `${formatarDataBR(data)}${hora ? ` · ${hora}` : ""}`,
        },
        { label: "Cubagem", valor: medicoes.cubagem || "—" },
        { label: "Consumo", valor: medicoes.consumo || "—" },
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
                        {editando ? "Editar análise — F6PGI6" : "Nova análise — F6PGI6"}
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
                            Silo *
                        </label>
                        <Combobox
                            onChange={setSilo}
                            opcoes={silos}
                            placeholder="Selecionar silo..."
                            valor={silo}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Tipo *
                        </label>
                        <Combobox
                            onChange={setTipoId}
                            opcoes={tipos}
                            placeholder="Selecionar tipo..."
                            valor={tipoId}
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted">
                                Cubagem
                            </label>
                            <CampoNumerico
                                onChange={(v) => setMedicoes((p) => ({ ...p, cubagem: v }))}
                                value={medicoes.cubagem}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted">
                                Consumo
                            </label>
                            <CampoNumerico
                                onChange={(v) => setMedicoes((p) => ({ ...p, consumo: v }))}
                                value={medicoes.consumo}
                            />
                        </div>
                    </div>
                </fieldset>

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