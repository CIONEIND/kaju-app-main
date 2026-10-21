"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
    salvarAnaliseF6PGI6,
    type SalvarAnaliseF6PGI6Input,
} from "@/app/services/producao/analises/salvarAnaliseF6PGI6";
import type { FormularioBaseProps } from "@/lib/analises/tipos";
import { Combobox } from "@/components/producao/ui/Combobox";

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

function texto(v: number | null | undefined): string {
    return v === null || v === undefined ? "" : String(v);
}

function paraNumero(t: string): number | null {
    const limpo = t.trim().replace(",", ".");
    if (limpo === "") return null;
    const n = Number(limpo);
    return Number.isFinite(n) ? n : null;
}

export function FormularioF6PGI6({
    modo = "novo",
    dadosIniciais,
    usuario,
    lotes,
    tipos,
    silos = [],
}: FormularioBaseProps) {
    const router = useRouter();
    const editando = modo === "editar" && dadosIniciais !== undefined;

    const [lote, setLote] = useState(
        dadosIniciais?.loteId != null ? String(dadosIniciais.loteId) : "",
    );
    const [silo, setSilo] = useState(
        dadosIniciais?.siloId != null ? String(dadosIniciais.siloId) : "",
    );
    const [tipo, setTipo] = useState(
        dadosIniciais?.tipoId != null ? String(dadosIniciais.tipoId) : "",
    );
    const [data, setData] = useState(dadosIniciais?.data ?? hoje());
    const [hora, setHora] = useState(dadosIniciais?.hora ?? agora());
    const [medicoes, setMedicoes] = useState<Medicoes>({
        cubagem: texto(dadosIniciais?.cubagem),
        consumo: texto(dadosIniciais?.consumo),
    });
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const semVinculo = usuario.cdUsrTopManager === null;

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErro(null);

        if (!lote) return setErro("Selecione o lote.");
        if (!silo) return setErro("Selecione o silo.");
        if (!tipo) return setErro("Selecione o tipo.");
        if (!data) return setErro("Informe a data da análise.");
        if (semVinculo) {
            return setErro("Usuário sem vínculo com o TopManager.");
        }

        setEnviando(true);
        try {
            const input: SalvarAnaliseF6PGI6Input = {
                id: editando ? dadosIniciais.id : undefined,
                data,
                hora: hora || undefined,
                responsavelCdUsr: usuario.cdUsrTopManager as number,
                loteId: Number(lote),
                siloId: Number(silo),
                tipoId: Number(tipo),
                cubagem: paraNumero(medicoes.cubagem),
                consumo: paraNumero(medicoes.consumo),
            };

            const r = await salvarAnaliseF6PGI6(input);
            if (!r.ok) {
                setErro(r.erro);
                return;
            }
            router.push(`/producao/analises/F6PGI6/${r.id}`);
        } finally {
            setEnviando(false);
        }
    }

    function limpar() {
        setLote("");
        setSilo("");
        setTipo("");
        setData(hoje());
        setHora(agora());
        setMedicoes({ cubagem: "", consumo: "" });
        setErro(null);
    }

    return (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold text-foreground">
                    {editando ? "Editar análise — F6PGI6" : "Nova análise — F6PGI6"}
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

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Lote *</label>
                        <Combobox opcoes={lotes} valor={lote} onChange={setLote} placeholder="Selecionar lote..." />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Silo *</label>
                        <Combobox opcoes={silos} valor={silo} onChange={setSilo} placeholder="Selecionar silo..." />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo *</label>
                        <Combobox opcoes={tipos} valor={tipo} onChange={setTipo} placeholder="Selecionar tipo..." />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Data *</label>
                        <input
                            type="date"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Hora</label>
                        <input
                            type="time"
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
                            className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </div>

                <fieldset className="rounded-lg border border-border p-4">
                    <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                        Medições
                    </legend>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted">Cubagem</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={medicoes.cubagem}
                                onChange={(e) => setMedicoes((p) => ({ ...p, cubagem: e.target.value }))}
                                placeholder="0,00"
                                className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted">Consumo</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={medicoes.consumo}
                                onChange={(e) => setMedicoes((p) => ({ ...p, consumo: e.target.value }))}
                                placeholder="0,00"
                                className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>
                </fieldset>

                <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                    <button
                        type="button"
                        onClick={() => (editando ? router.back() : limpar())}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
                    >
                        {editando ? "Cancelar" : "Limpar"}
                    </button>
                    <button
                        type="submit"
                        disabled={enviando || semVinculo}
                        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                        {enviando ? "Salvando..." : "Salvar análise"}
                    </button>
                </div>
            </form>
        </div>
    );
}