"use client";
import { Button, useOverlayState } from "@heroui/react";
import { ArrowLeft, Loader2, Lock, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    salvarAnaliseF6PGI6,
    type SalvarAnaliseF6PGI6Input,
} from "@/app/services/producao/analises/salvarAnaliseF6PGI6";
import { consultarSiloTipo } from "@/app/services/producao/analises/consultarSiloTipo";
import { CampoNumerico } from "@/components/producao/ui/CampoNumerico";
import { Combobox } from "@/components/producao/ui/Combobox";
import {
    formatarDataBR,
    paraNumero,
    paraTexto,
} from "@/lib/analises/numerico";
import {
    calcularLeitura,
    ErroCalculoSilo,
    type GeometriaSilo,
    type ModoMedicao,
    type ResultadoCalculo,
} from "@/lib/analises/calculo-silo";
import type {
    FormularioBaseProps,
    OpcaoSilo,
} from "@/lib/analises/tipos";
import { ConfirmarSalvarModal } from "./ConfirmarSalvarModal";
import { useRascunho } from "./useRascunho";

interface Medicoes {
    vazioInicial: string;
    vazioFinal: string;
}

interface Parametros {
    geometria: GeometriaSilo;
    pesoKgM3: number;
    safra: string;
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

/** Nível válido: número não negativo com até 2 casas decimais */
function nivelValido(texto: string): boolean {
    if (!texto.trim()) return true;
    const n = paraNumero(texto);
    if (n === null || n < 0) return false;
    return Math.abs(n * 100 - Math.round(n * 100)) <= 1e-9;
}

const nf = (v: number, c = 2) =>
    v.toLocaleString("pt-BR", {
        minimumFractionDigits: c,
        maximumFractionDigits: c,
    });

/** Seção numerada — mesmo padrão visual do mock */
function Secao({
    numero,
    titulo,
    descricao,
    badge,
    children,
    bloqueada,
}: {
    numero: number;
    titulo: string;
    descricao?: string;
    badge?: string;
    children: React.ReactNode;
    bloqueada?: boolean;
}) {
    return (
        <section
            className={`rounded-xl border border-border bg-surface p-5 ${bloqueada ? "opacity-60" : ""
                }`}
        >
            <header className="mb-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {numero}
                    </span>
                    {titulo}
                    {badge && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                            {badge}
                        </span>
                    )}
                    {bloqueada && <Lock className="size-3.5 text-muted" />}
                </h3>
                {descricao && (
                    <p className="mt-1.5 text-xs text-muted">{descricao}</p>
                )}
            </header>
            {children}
        </section>
    );
}

/** Toggle vazio/produto — aparece dentro de cada leitura */
function ToggleModo({
    valor,
    onChange,
    disabled,
}: {
    valor: ModoMedicao;
    onChange: (m: ModoMedicao) => void;
    disabled?: boolean;
}) {
    const base =
        "px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
    const ativo = "bg-[#1e3a5f] text-white shadow-sm";
    const inativo =
        "bg-white text-[#1e3a5f] border-l border-[#1e3a5f]/20 hover:bg-[#1e3a5f]/5";
    return (
        <div className="inline-flex overflow-hidden rounded-lg border border-[#1e3a5f]/30">
            <button
                className={`${base} ${valor === "vazio" ? ativo : inativo}`}
                disabled={disabled}
                onClick={() => onChange("vazio")}
                type="button"
            >
                Medir vazio
            </button>
            <button
                className={`${base} ${valor === "produto" ? ativo : inativo}`}
                disabled={disabled}
                onClick={() => onChange("produto")}
                type="button"
            >
                Medir produto
            </button>
        </div>
    );
}

/** Painel de métricas ao vivo de uma leitura */
function MetricasLeitura({
    leitura,
    erro,
}: {
    leitura: ResultadoCalculo | null;
    erro: string | null;
}) {
    if (erro) {
        return (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {erro}
            </div>
        );
    }
    if (!leitura) {
        return (
            <div className="mt-3 rounded-lg border border-dashed border-border bg-surface-secondary p-3 text-xs text-muted">
                Informe o nível medido para ver o cálculo.
            </div>
        );
    }
    const itens = [
        { label: "Altura útil a", valor: `${nf(leitura.alturaGrao)} m` },
        { label: "VC", valor: `${nf(leitura.volumeCilindro)} m³` },
        { label: "VTC", valor: `${nf(leitura.volumeTronco)} m³` },
        { label: "VTOTAL", valor: `${nf(leitura.volumeTotal)} m³` },
        { label: "Peso", valor: `${nf(leitura.pesoKg)} kg` },
    ];
    return (
        <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {itens.map((i) => (
                    <div
                        key={i.label}
                        className="rounded-lg bg-surface-secondary px-2.5 py-2"
                    >
                        <p className="text-[10px] uppercase tracking-wide text-muted">
                            {i.label}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                            {i.valor}
                        </p>
                    </div>
                ))}
            </div>
            <div>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-muted">Lotação</span>
                    <span className="font-medium text-foreground">
                        Lotação {Math.round(leitura.lotacao)}%
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, leitura.lotacao))}%` }}
                    />
                </div>
            </div>
        </div>
    );
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
    const [modoInicial, setModoInicial] = useState<ModoMedicao>(
        dadosIniciais?.modoMedicao ?? "vazio",
    );
    const [modoFinal, setModoFinal] = useState<ModoMedicao>(
        dadosIniciais?.modoMedicao ?? "vazio",
    );
    const [competencia, setCompetencia] = useState(
        dadosIniciais?.dataInicial ?? hoje(),
    );
    const [dataInicial, setDataInicial] = useState(
        dadosIniciais?.dataInicial ?? hoje(),
    );
    const [horaInicial, setHoraInicial] = useState(
        dadosIniciais?.horaInicial ?? agora(),
    );
    const [dataFinal, setDataFinal] = useState(dadosIniciais?.dataFinal ?? "");
    const [horaFinal, setHoraFinal] = useState(dadosIniciais?.horaFinal ?? "");
    const [medicoes, setMedicoes] = useState<Medicoes>({
        vazioInicial: paraTexto(dadosIniciais?.vazioInicial),
        vazioFinal: paraTexto(dadosIniciais?.vazioFinal),
    });
    const [abrirProxima, setAbrirProxima] = useState(true);
    const [sucessoConfirmacao, setSucessoConfirmacao] = useState(false);
    const [erroConfirmacao, setErroConfirmacao] = useState<string | null>(null);
    const [rascunhoId, setRascunhoId] = useState<number | null>(
        dadosIniciais?.id ?? null,
    );
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    /* Parâmetros vigentes — geometria + peso específico */
    const [parametros, setParametros] = useState<Parametros | null>(null);
    const [carregandoParametros, setCarregandoParametros] = useState(false);
    const [erroParametros, setErroParametros] = useState<string | null>(null);

    const semVinculo = usuario.cdUsrTopManager === null;
    const siloSelecionado: OpcaoSilo | undefined = silos.find(
        (s) => s.valor === silo,
    );

    /* Consulta geometria + peso sempre que silo, tipo ou data mudam */
    useEffect(() => {
        const siloNum = Number(silo);
        const tipoNum = Number(tipoId);
        if (!silo || !tipoId || !dataInicial) {
            setParametros(null);
            setErroParametros(null);
            return;
        }
        let cancelado = false;
        setCarregandoParametros(true);
        setErroParametros(null);
        consultarSiloTipo(siloNum, tipoNum, dataInicial)
            .then((r) => {
                if (cancelado) return;
                if (r.ok) {
                    setParametros(r.dados);
                    setErroParametros(null);
                } else {
                    setParametros(null);
                    setErroParametros(r.erro);
                }
            })
            .catch(() => {
                if (cancelado) return;
                setParametros(null);
                setErroParametros(
                    "Não foi possível carregar os parâmetros do silo.",
                );
            })
            .finally(() => {
                if (!cancelado) setCarregandoParametros(false);
            });
        return () => {
            cancelado = true;
        };
    }, [silo, tipoId, dataInicial]);

    const inicialPreenchida =
        medicoes.vazioInicial.trim() !== "" &&
        nivelValido(medicoes.vazioInicial);

    /*
     * Leitura final: se o vazio final foi digitado, a leitura existe —
     * e leitura sem data/hora não é leitura. Serve para o feedback visual
     * e para a crítica no submit.
     */
    const vazioFinalInformado = medicoes.vazioFinal.trim() !== "";
    const finalIncompleta =
        vazioFinalInformado && (!dataFinal || !horaFinal);

    const podeRascunhar =
        Boolean(lote) &&
        Boolean(silo) &&
        Boolean(tipoId) &&
        Boolean(dataInicial) &&
        !semVinculo;

    /* Cálculo ao vivo com o motor real */
    const leituraInicial = useMemo<{
        leitura: ResultadoCalculo | null;
        erro: string | null;
    }>(() => {
        if (!parametros) return { leitura: null, erro: null };
        const nivel = paraNumero(medicoes.vazioInicial);
        if (nivel === null) return { leitura: null, erro: null };
        try {
            return {
                leitura: calcularLeitura({
                    geometria: parametros.geometria,
                    valorMedido: nivel,
                    modo: modoInicial,
                    pesoEspecifico: parametros.pesoKgM3,
                }),
                erro: null,
            };
        } catch (e) {
            return {
                leitura: null,
                erro: e instanceof ErroCalculoSilo ? e.message : "Valor inválido.",
            };
        }
    }, [parametros, medicoes.vazioInicial, modoInicial]);

    const leituraFinal = useMemo<{
        leitura: ResultadoCalculo | null;
        erro: string | null;
    }>(() => {
        if (!parametros) return { leitura: null, erro: null };
        const nivel = paraNumero(medicoes.vazioFinal);
        if (nivel === null) return { leitura: null, erro: null };
        try {
            return {
                leitura: calcularLeitura({
                    geometria: parametros.geometria,
                    valorMedido: nivel,
                    modo: modoFinal,
                    pesoEspecifico: parametros.pesoKgM3,
                }),
                erro: null,
            };
        } catch (e) {
            return {
                leitura: null,
                erro: e instanceof ErroCalculoSilo ? e.message : "Valor inválido.",
            };
        }
    }, [parametros, medicoes.vazioFinal, modoFinal]);

    const consumo = useMemo(() => {
        const ini = leituraInicial.leitura;
        const fim = leituraFinal.leitura;
        if (!ini || !fim) return null;
        const volume = ini.volumeTotal - fim.volumeTotal;
        if (volume < 0) return null;
        return { volume, peso: volume * (parametros?.pesoKgM3 ?? 0) };
    }, [leituraInicial.leitura, leituraFinal.leitura, parametros]);

    const cruzouMeiaNoite =
        Boolean(dataFinal) &&
        new Date(`${dataFinal}T${horaFinal || "00:00"}:00`) >
        new Date(`${dataInicial}T${horaInicial || "00:00"}:00`);

    const finalMaiorQueInicial =
        Boolean(leituraInicial.leitura && leituraFinal.leitura) &&
        (leituraFinal.leitura as ResultadoCalculo).volumeTotal >
        (leituraInicial.leitura as ResultadoCalculo).volumeTotal;

    const { salvando, ultimoSalvo, cancelar } = useRascunho({
        habilitado: podeRascunhar && !editando && !enviando,
        dados: {
            lote,
            silo,
            tipoId,
            dataInicial,
            horaInicial,
            dataFinal,
            horaFinal,
            modoMedicao: modoInicial,
            medicoes,
        },
        idAtual: rascunhoId,
        salvar: async (d, id) => {
            const r = await salvarAnaliseF6PGI6({
                id: id ?? undefined,
                status: "rascunho",
                responsavelCdUsr: usuario.cdUsrTopManager as number,
                loteId: Number(d.lote),
                siloId: Number(d.silo),
                tipoId: Number(d.tipoId),
                modoMedicao: d.modoMedicao,
                dataInicial: d.dataInicial,
                horaInicial: d.horaInicial || undefined,
                vazioInicial: paraNumero(d.medicoes.vazioInicial),
                dataFinal: d.dataFinal || undefined,
                horaFinal: d.horaFinal || undefined,
                vazioFinal: paraNumero(d.medicoes.vazioFinal),
            });
            return r.ok ? { ok: true, id: r.id } : { ok: false, erro: r.erro };
        },
        onId: setRascunhoId,
    });

    function alterarVazioInicial(v: string) {
        setMedicoes((p) => ({
            ...p,
            vazioInicial: v,
            vazioFinal: v.trim() === "" ? "" : p.vazioFinal,
        }));
    }

    function recalcularCompetencia() {
        setCompetencia(dataInicial);
    }

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErro(null);
        if (!lote) return setErro("Selecione o lote.");
        if (!silo) return setErro("Selecione o silo.");
        if (!tipoId) return setErro("Selecione o tipo.");
        if (!dataInicial) return setErro("Informe a data da leitura inicial.");
        if (semVinculo) return setErro("Usuário sem vínculo com o TopManager.");
        if (!parametros) {
            return setErro(
                erroParametros ?? "Aguarde o carregamento dos parâmetros do silo.",
            );
        }
        if (!nivelValido(medicoes.vazioInicial)) {
            return setErro(
                "O vazio inicial deve ser um número não negativo com até 2 casas decimais.",
            );
        }
        if (!inicialPreenchida) {
            return setErro("Informe a leitura inicial antes de concluir.");
        }
        if (leituraInicial.erro) return setErro(leituraInicial.erro);

        /*
         * Leitura final: só é obrigatória quando o vazio final foi digitado.
         * Rascunho continua livre — a crítica acontece apenas ao concluir.
         */
        if (vazioFinalInformado) {
            if (!nivelValido(medicoes.vazioFinal)) {
                return setErro(
                    "O vazio final deve ser um número não negativo com até 2 casas decimais.",
                );
            }
            if (!dataFinal) {
                return setErro(
                    "Informe a data da leitura final — o vazio final foi preenchido.",
                );
            }
            if (!horaFinal) {
                return setErro(
                    "Informe a hora da leitura final — o vazio final foi preenchido.",
                );
            }
            if (leituraFinal.erro) return setErro(leituraFinal.erro);
            if (finalMaiorQueInicial) {
                return setErro(
                    "A leitura final tem volume maior que a inicial — verifique as medições.",
                );
            }
            const ini = new Date(`${dataInicial}T${horaInicial || "00:00"}:00`);
            const fim = new Date(`${dataFinal}T${horaFinal}:00`);
            if (fim < ini) {
                return setErro(
                    "A leitura final não pode ser anterior à leitura inicial.",
                );
            }
        }

        setErroConfirmacao(null);
        setSucessoConfirmacao(false);
        confirmacao.open();
    }

    async function confirmarSalvar() {
        cancelar();
        setEnviando(true);
        setErroConfirmacao(null);
        try {
            const input: SalvarAnaliseF6PGI6Input = {
                id: rascunhoId ?? undefined,
                status: "concluida",
                responsavelCdUsr: usuario.cdUsrTopManager as number,
                loteId: Number(lote),
                siloId: Number(silo),
                tipoId: Number(tipoId),
                modoMedicao: modoInicial,
                dataInicial,
                horaInicial: horaInicial || undefined,
                vazioInicial: paraNumero(medicoes.vazioInicial),
                dataFinal: dataFinal || undefined,
                horaFinal: horaFinal || undefined,
                vazioFinal: paraNumero(medicoes.vazioFinal),
            };
            const r = await salvarAnaliseF6PGI6(input);
            if (!r.ok) {
                setErro(r.erro);
                return;
            }
            setSucessoConfirmacao(true);
            setTimeout(() => {
                confirmacao.close();
                router.push(basePath);
                router.refresh();
            }, 900);
        } catch (e) {
            setErroConfirmacao(
                e instanceof Error ? e.message : "Erro ao salvar a análise.",
            );
        } finally {
            setEnviando(false);
        }
    }

    function limpar() {
        setLote("");
        setSilo("");
        setTipoId("");
        setModoInicial("vazio");
        setModoFinal("vazio");
        setDataInicial(hoje());
        setHoraInicial(agora());
        setCompetencia(hoje());
        setDataFinal("");
        setHoraFinal("");
        setMedicoes({ vazioInicial: "", vazioFinal: "" });
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
            valor: siloSelecionado?.rotulo ?? "—",
        },
        {
            label: "Tipo",
            valor: tipos.find((t) => t.valor === tipoId)?.rotulo ?? "—",
        },
        {
            label: "Competência",
            valor: competencia ? formatarDataBR(competencia) : "—",
        },
        {
            label: "Leitura inicial",
            valor: `${formatarDataBR(dataInicial)}${horaInicial ? ` · ${horaInicial}` : ""} · ${medicoes.vazioInicial || "—"} m`,
        },
        {
            label: "Leitura final",
            valor: dataFinal
                ? `${formatarDataBR(dataFinal)}${horaFinal ? ` · ${horaFinal}` : ""} · ${medicoes.vazioFinal || "—"} m`
                : "—",
        },
    ];

    const campo =
        "w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-base outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";
    const campoErro =
        "w-full rounded-lg border border-red-400 bg-red-50 px-3 py-2 text-base outline-none ring-1 ring-red-200 focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";
    const rotulo = "mb-1.5 block text-sm font-medium text-foreground";
    const ajuda = "mt-1 text-[11px] text-muted";

    return (
        <div className="space-y-4">
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-6 py-4 shadow-sm">
                <button
                    aria-label="Voltar para a central"
                    className="rounded-md p-1.5 text-muted hover:bg-surface-secondary hover:text-foreground"
                    onClick={() => router.push(basePath)}
                    type="button"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-foreground">
                        {editando ? "Editar análise — F6PGI6" : "Nova análise — F6PGI6"}
                    </h2>
                    <p className="text-sm text-muted">
                        Controle de consumo de silos · Registre a leitura inicial e final
                        para calcular o volume consumido no período.
                    </p>
                </div>
                {!editando && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
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
            </div>

            {semVinculo && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Seu usuário não está vinculado a um CdUsr do TopManager.
                </div>
            )}

            {erro && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {erro}
                </div>
            )}

            {erroParametros && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {erroParametros}
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                {/* 1. Identificação */}
                <Secao
                    descricao="Dados do lote, do silo e do tipo de análise que define o peso específico."
                    numero={1}
                    titulo="Identificação"
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={rotulo}>Lote *</label>
                            <Combobox
                                onChange={setLote}
                                opcoes={lotes}
                                placeholder="Selecionar lote..."
                                valor={lote}
                            />
                            <p className={ajuda}>Lote de origem do produto armazenado.</p>
                        </div>
                        <div>
                            <label className={rotulo}>
                                Silo *
                                {siloSelecionado && (
                                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                        Tipo {siloSelecionado.tipoSilo} · altura{" "}
                                        {nf(siloSelecionado.alturaUtil)} m
                                    </span>
                                )}
                            </label>
                            <Combobox
                                onChange={setSilo}
                                opcoes={silos}
                                placeholder="Selecionar silo..."
                                valor={silo}
                            />
                            <p className={ajuda}>
                                A altura do tipo define o vazio total do silo.
                            </p>
                        </div>
                        <div>
                            <label className={rotulo}>Tipo de análise *</label>
                            <Combobox
                                onChange={setTipoId}
                                opcoes={tipos}
                                placeholder="Selecionar tipo..."
                                valor={tipoId}
                            />
                            <p className={ajuda}>
                                {parametros
                                    ? `Peso específico vigente: ${nf(parametros.pesoKgM3, 0)} kg/m³ · safra ${parametros.safra}`
                                    : "O peso específico converte volume em quilogramas."}
                            </p>
                        </div>
                        <div>
                            <label className={rotulo}>Responsável</label>
                            <input
                                className={campo}
                                disabled
                                readOnly
                                value={usuario.nome}
                            />
                            <p className={ajuda}>
                                Preenchido automaticamente pelo login do operador.
                            </p>
                        </div>
                    </div>
                </Secao>

                {/* 2. Competência do consumo restrito */}
                <Secao
                    badge="restrito"
                    descricao="Define a qual dia o consumo medido pertence no fechamento de produção."
                    numero={2}
                    titulo="Competência do consumo"
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={rotulo}>Dia de produção</label>
                            <input
                                className={campo}
                                onChange={(e) => setCompetencia(e.target.value)}
                                type="date"
                                value={competencia}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onPress={recalcularCompetencia} variant="secondary">
                                <RotateCcw className="mr-1.5 size-3.5" />
                                Recalcular pelo padrão
                            </Button>
                        </div>
                    </div>
                    <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
                        O consumo é atribuído ao dia em que o processamento começou, não ao
                        dia da leitura final. A leitura das 00:00 fecha este dia e abre o
                        seguinte.
                    </p>
                </Secao>

                {/* 3. Leitura inicial */}
                <Secao
                    descricao="Primeira medição do período. Ela define o volume de partida do silo."
                    numero={3}
                    titulo="Leitura inicial"
                >
                    <div className="mb-4">
                        <ToggleModo
                            disabled={carregandoParametros}
                            onChange={setModoInicial}
                            valor={modoInicial}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label className={rotulo}>Data *</label>
                            <input
                                className={campo}
                                onChange={(e) => setDataInicial(e.target.value)}
                                type="date"
                                value={dataInicial}
                            />
                        </div>
                        <div>
                            <label className={rotulo}>Hora</label>
                            <input
                                className={campo}
                                onChange={(e) => setHoraInicial(e.target.value)}
                                type="time"
                                value={horaInicial}
                            />
                        </div>
                        <div>
                            <label className={rotulo}>
                                {modoInicial === "vazio"
                                    ? "Nível de vazio medido (m)"
                                    : "Altura do produto (m)"}
                            </label>
                            <CampoNumerico
                                onChange={alterarVazioInicial}
                                value={medicoes.vazioInicial}
                            />
                            <p className={ajuda}>
                                {modoInicial === "vazio"
                                    ? "Distância medida do topo até a superfície do produto."
                                    : "Altura da coluna de produto dentro do silo."}
                            </p>
                        </div>
                    </div>
                    {carregandoParametros ? (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface-secondary p-3 text-xs text-muted">
                            <Loader2 className="size-3 animate-spin" />
                            Carregando parâmetros do silo…
                        </div>
                    ) : (
                        <MetricasLeitura
                            erro={leituraInicial.erro}
                            leitura={leituraInicial.leitura}
                        />
                    )}
                </Secao>

                {/* 4. Leitura final */}
                <Secao
                    bloqueada={!inicialPreenchida}
                    descricao={
                        inicialPreenchida
                            ? "Medição de fechamento. Quando ocorre após a meia-noite, o consumo pertence ao dia anterior."
                            : "Preencha a leitura inicial para liberar a leitura final."
                    }
                    numero={4}
                    titulo="Leitura final"
                >
                    <div className="mb-4">
                        <ToggleModo
                            disabled={!inicialPreenchida || carregandoParametros}
                            onChange={setModoFinal}
                            valor={modoFinal}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label className={rotulo}>
                                Data
                                {vazioFinalInformado && !dataFinal && (
                                    <span className="ml-2 text-[10px] font-semibold uppercase text-red-600">
                                        obrigatória
                                    </span>
                                )}
                            </label>
                            <input
                                className={
                                    finalIncompleta && !dataFinal ? campoErro : campo
                                }
                                disabled={!inicialPreenchida}
                                onChange={(e) => setDataFinal(e.target.value)}
                                type="date"
                                value={dataFinal}
                            />
                        </div>
                        <div>
                            <label className={rotulo}>
                                Hora
                                {vazioFinalInformado && !horaFinal && (
                                    <span className="ml-2 text-[10px] font-semibold uppercase text-red-600">
                                        obrigatória
                                    </span>
                                )}
                            </label>
                            <input
                                className={
                                    finalIncompleta && !horaFinal ? campoErro : campo
                                }
                                disabled={!inicialPreenchida}
                                onChange={(e) => setHoraFinal(e.target.value)}
                                type="time"
                                value={horaFinal}
                            />
                        </div>
                        <div>
                            <label className={rotulo}>
                                {modoFinal === "vazio"
                                    ? "Nível de vazio medido (m)"
                                    : "Altura do produto (m)"}
                            </label>
                            <CampoNumerico
                                onChange={(v) =>
                                    setMedicoes((p) => ({ ...p, vazioFinal: v }))
                                }
                                value={medicoes.vazioFinal}
                            />
                        </div>
                    </div>

                    {finalIncompleta && (
                        <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
                            O vazio final foi preenchido. Informe a data e a hora da
                            leitura final para concluir a análise.
                        </div>
                    )}

                    <MetricasLeitura
                        erro={leituraFinal.erro}
                        leitura={leituraFinal.leitura}
                    />

                    {cruzouMeiaNoite && (
                        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                            Leitura após a meia-noite — o consumo desta análise pertence ao dia{" "}
                            {formatarDataBR(dataInicial)}.
                        </div>
                    )}

                    {finalMaiorQueInicial && (
                        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            A leitura final tem volume maior que a inicial — verifique as
                            medições.
                        </div>
                    )}
                </Secao>

                {/* 5. Consumo do período */}
                <Secao
                    descricao="Calculado a partir das duas leituras e do peso específico do tipo."
                    numero={5}
                    titulo="Consumo do período"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg bg-surface-secondary p-3">
                            <p className="text-xs text-muted">Volume consumido</p>
                            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                                {consumo ? `${nf(consumo.volume)} m³` : "—"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted">
                                Diferença entre VTOTAL inicial e final
                            </p>
                        </div>
                        <div className="rounded-lg bg-surface-secondary p-3">
                            <p className="text-xs text-muted">Peso consumido</p>
                            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                                {consumo ? `${nf(consumo.peso)} kg` : "—"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted">
                                Volume consumido × peso específico
                            </p>
                        </div>
                        <div className="rounded-lg bg-surface-secondary p-3">
                            <p className="text-xs text-muted">Competência</p>
                            <p className="mt-1 text-lg font-semibold text-foreground">
                                {competencia ? formatarDataBR(competencia) : "—"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted">
                                Dia de processamento atribuído
                            </p>
                        </div>
                    </div>
                    {consumo && leituraInicial.leitura && leituraFinal.leitura && (
                        <p className="mt-3 rounded-lg bg-surface-secondary px-3 py-2 text-xs text-muted">
                            {nf(leituraInicial.leitura.volumeTotal)} −{" "}
                            {nf(leituraFinal.leitura.volumeTotal)} = {nf(consumo.volume)} m³ ·{" "}
                            {nf(consumo.volume)} × {nf(parametros?.pesoKgM3 ?? 0, 0)} ={" "}
                            {nf(consumo.peso)} kg
                        </p>
                    )}
                    {cruzouMeiaNoite && (
                        <p className="mt-2 text-xs text-muted">
                            Leitura inicial {formatarDataBR(dataInicial)} {horaInicial} →
                            leitura final {formatarDataBR(dataFinal)} {horaFinal}
                        </p>
                    )}
                </Secao>

                {/* 6. Próxima análise */}
                <Secao
                    badge={cruzouMeiaNoite ? "novo" : undefined}
                    descricao="Gerada quando a leitura final atravessa a meia-noite, para que o restante do silo continue com consumo registrado."
                    numero={6}
                    titulo="Próxima análise — abertura automática"
                >
                    {cruzouMeiaNoite ? (
                        <>
                            <p className="text-sm text-muted">
                                Como esta análise atravessou a meia-noite, o sistema vai abrir
                                automaticamente uma nova análise em rascunho para o dia{" "}
                                {formatarDataBR(dataFinal)}, já com a leitura inicial
                                preenchida. Assim o restante do silo não fica sem consumo
                                registrado.
                            </p>
                            <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                                <div className="flex justify-between gap-2">
                                    <span className="text-muted">Competência</span>
                                    <span className="font-medium text-foreground">
                                        {formatarDataBR(dataFinal)}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-muted">Leitura inicial (herdada)</span>
                                    <span className="font-medium text-foreground">
                                        {formatarDataBR(dataFinal)} {horaFinal} · vazio{" "}
                                        {medicoes.vazioFinal || "—"} m · VTOTAL{" "}
                                        {leituraFinal.leitura
                                            ? nf(leituraFinal.leitura.volumeTotal)
                                            : "—"}{" "}
                                        m³
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-muted">Leitura final</span>
                                    <span className="font-medium text-foreground">
                                        a preencher
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-muted">Status</span>
                                    <span className="font-medium text-foreground">Rascunho</span>
                                </div>
                                <div className="flex justify-between gap-2 sm:col-span-2">
                                    <span className="text-muted">Silo / Tipo</span>
                                    <span className="font-medium text-foreground">
                                        {siloSelecionado?.rotulo ?? "—"} ·{" "}
                                        {tipos.find((t) => t.valor === tipoId)?.rotulo ?? "—"}
                                    </span>
                                </div>
                            </div>
                            <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
                                <input
                                    checked={abrirProxima}
                                    className="size-4 rounded border-border"
                                    onChange={(e) => setAbrirProxima(e.target.checked)}
                                    type="checkbox"
                                />
                                Abrir automaticamente a próxima análise ao salvar
                            </label>
                            <p className="mt-1 text-[11px] text-muted">
                                Sem a abertura automática, o consumo do dia{" "}
                                {formatarDataBR(dataFinal)} pode ficar sem registro até a
                                próxima medição.
                            </p>
                        </>
                    ) : (
                        <div className="rounded-lg border border-dashed border-border bg-surface-secondary p-4">
                            <p className="text-sm text-muted">
                                Nenhuma próxima análise será criada. A abertura automática só
                                acontece quando a leitura final ocorre em um dia diferente da
                                inicial.
                            </p>
                        </div>
                    )}
                </Secao>

                <div className="flex items-center justify-end gap-2 rounded-xl border border-border bg-surface px-6 py-4">
                    <Button
                        onPress={() => (editando ? router.push(basePath) : limpar())}
                        variant="secondary"
                    >
                        {editando ? "Cancelar" : "Limpar"}
                    </Button>
                    <Button
                        isDisabled={
                            enviando ||
                            semVinculo ||
                            !inicialPreenchida ||
                            !parametros ||
                            carregandoParametros
                        }
                        type="submit"
                        variant="primary"
                    >
                        {enviando
                            ? "Salvando..."
                            : cruzouMeiaNoite && abrirProxima
                                ? "Salvar análise e abrir próxima"
                                : "Salvar análise"}
                    </Button>
                </div>
            </form>

            <ConfirmarSalvarModal
                editando={editando}
                erro={erroConfirmacao}
                enviando={enviando}
                onConfirmar={confirmarSalvar}
                resumo={resumo}
                state={confirmacao}
                sucesso={sucessoConfirmacao}
            />
        </div>
    );
}