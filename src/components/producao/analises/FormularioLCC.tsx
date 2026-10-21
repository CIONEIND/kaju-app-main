"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
    salvarAnaliseLCC,
    type SalvarAnaliseLCCInput,
} from "@/app/services/producao/analises/salvarAnaliseLCC";
import { Combobox } from "@/components/producao/ui/Combobox";
import type { FormularioBaseProps } from "@/lib/analises/tipos";

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

function texto(v: number | null | undefined): string {
    return v === null || v === undefined ? "" : String(v);
}

function paraNumero(t: string): number | null {
    const limpo = t.trim().replace(",", ".");
    if (limpo === "") return null;
    const n = Number(limpo);
    return Number.isFinite(n) ? n : null;
}

function formatar(v: number | null): string {
    if (v === null) return "—";
    return v.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function FormularioLCC({
    modo = "novo",
    dadosIniciais,
    usuario,
    lotes,
    origens = [],
}: FormularioBaseProps) {
    const router = useRouter();
    const editando = modo === "editar" && dadosIniciais !== undefined;

    const [lote, setLote] = useState(
        dadosIniciais?.loteId != null ? String(dadosIniciais.loteId) : "",
    );
    const [origem, setOrigem] = useState(
        dadosIniciais?.origemId != null ? String(dadosIniciais.origemId) : "",
    );
    const [data, setData] = useState(dadosIniciais?.data ?? hoje());
    const [hora, setHora] = useState(dadosIniciais?.hora ?? agora());
    const [viscosidade, setViscosidade] = useState(
        texto(dadosIniciais?.viscosidade),
    );
    const [altura, setAltura] = useState(texto(dadosIniciais?.altura));
    const [temperatura, setTemperatura] = useState(
        texto(dadosIniciais?.temperatura),
    );
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const semVinculo = usuario.cdUsrTopManager === null;

    // Preview do resultado, exatamente como o banco vai calcular
    const resultadoPrevisto = useMemo(
        () => calcularResultado(paraNumero(altura), paraNumero(temperatura)),
        [altura, temperatura],
    );

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErro(null);

        if (!lote) return setErro("Selecione o lote.");
        if (!origem) return setErro("Selecione a origem.");
        if (!data) return setErro("Informe a data da análise.");
        if (semVinculo) return setErro("Usuário sem vínculo com o TopManager.");

        setEnviando(true);
        try {
            const input: SalvarAnaliseLCCInput = {
                id: editando ? dadosIniciais.id : undefined,
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
                setErro(r.erro);
                return;
            }
            router.push(`/producao/analises/LCC/${r.id}`);
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
        setErro(null);
    }

    const campo =
        "w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30";

    return (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold text-foreground">
                    {editando ? "Editar análise — LCC" : "Nova análise — LCC"}
                </h2>
                <p className="text-sm text-muted">
                    Responsável:{" "}
                    <span className="font-medium text-foreground">{usuario.nome}</span>
                    {usuario.cdUsrTopManager !== null && (
                        <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            CdUsr {usuario.cdUsrTopManager}
                        </span>
                    )}
                </p>
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
                            opcoes={lotes}
                            valor={lote}
                            onChange={setLote}
                            placeholder="Selecionar lote..."
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Origem *
                        </label>
                        <Combobox
                            opcoes={origens}
                            valor={origem}
                            onChange={setOrigem}
                            placeholder="Selecionar origem..."
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Data *
                        </label>
                        <input
                            className={campo}
                            type="date"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Hora
                        </label>
                        <input
                            className={campo}
                            type="time"
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
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
                            <input
                                className={campo}
                                inputMode="decimal"
                                placeholder="0,00"
                                type="text"
                                value={viscosidade}
                                onChange={(e) => setViscosidade(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted">
                                Altura
                            </label>
                            <input
                                className={campo}
                                inputMode="decimal"
                                placeholder="0,00"
                                type="text"
                                value={altura}
                                onChange={(e) => setAltura(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted">
                                Temperatura
                            </label>
                            <input
                                className={campo}
                                inputMode="decimal"
                                placeholder="0,00"
                                type="text"
                                value={temperatura}
                                onChange={(e) => setTemperatura(e.target.value)}
                            />
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
                        {formatar(resultadoPrevisto)}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                    <button
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
                        type="button"
                        onClick={() => (editando ? router.back() : limpar())}
                    >
                        {editando ? "Cancelar" : "Limpar"}
                    </button>
                    <button
                        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                        disabled={enviando || semVinculo}
                        type="submit"
                    >
                        {enviando ? "Salvando..." : "Salvar análise"}
                    </button>
                </div>
            </form>
        </div>
    );
}