import { Pencil, Eye } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { consultarAnalisesF3PGI6 } from "@/app/services/producao/analises/consultarAnalisesF3PGI6";
import { NovaAnaliseModal } from "./NovaAnaliseModal";
import { getCurrentUserAccess } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

const POR_PAGINA = 20;

function formatarNumero(valor: number | null): string {
    if (valor === null) return "—";
    return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function lerTexto(valor: string | string[] | undefined): string | undefined {
    return typeof valor === "string" && valor.trim() !== "" ? valor : undefined;
}

function lerNumero(valor: string | string[] | undefined): number | undefined {
    if (typeof valor !== "string" || valor.trim() === "") return undefined;
    const n = Number(valor);
    return Number.isInteger(n) && n > 0 ? n : undefined;
}

export default async function CentralAnalisesPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const usuario = await getUsuarioAtual();
    if (!usuario) redirect("/login");
    const access = await getCurrentUserAccess();
    if (!access?.permissions.has(PERMISSIONS.ANALISES_VIEW)) notFound();

    const params = await searchParams;
    const dtInicial = lerTexto(params.dt);
    const dtFinal = lerTexto(params.ate);
    const loteId = lerNumero(params.lote);
    const tipoId = lerNumero(params.tipo);
    const pagina = Math.max(1, lerNumero(params.pagina) ?? 1);

    const { analises, total, lotes, tipos } = await consultarAnalisesF3PGI6({
        dtInicial,
        dtFinal,
        loteId,
        tipoId,
        limite: POR_PAGINA,
        offset: (pagina - 1) * POR_PAGINA,
    });

    const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

    function urlComPagina(p: number) {
        const qs = new URLSearchParams();
        if (dtInicial) qs.set("dt", dtInicial);
        if (dtFinal) qs.set("ate", dtFinal);
        if (loteId) qs.set("lote", String(loteId));
        if (tipoId) qs.set("tipo", String(tipoId));
        qs.set("pagina", String(p));
        return `/producao/analises?${qs.toString()}`;
    }

    return (
        <main className="mx-auto max-w-7xl space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                        Produção
                    </p>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Central de análises
                    </h1>
                    <p className="text-sm text-muted">
                        Registros de análise de amêndoa e casca vinculados ao TopManager.
                    </p>
                </div>
                <NovaAnaliseModal />
            </div>

            {/* Filtros */}
            <form
                className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
                method="get"
            >
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted" htmlFor="dt">
                        De
                    </label>
                    <input
                        className="rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        defaultValue={dtInicial ?? ""}
                        id="dt"
                        name="dt"
                        type="date"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted" htmlFor="ate">
                        Até
                    </label>
                    <input
                        className="rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        defaultValue={dtFinal ?? ""}
                        id="ate"
                        name="ate"
                        type="date"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted" htmlFor="lote">
                        Lote
                    </label>
                    <select
                        className="min-w-44 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        defaultValue={loteId ? String(loteId) : ""}
                        id="lote"
                        name="lote"
                    >
                        <option value="">Todos</option>
                        {lotes.map((l) => (
                            <option key={l.id} value={String(l.id)}>
                                {l.nome}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted" htmlFor="tipo">
                        Tipo
                    </label>
                    <select
                        className="min-w-44 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        defaultValue={tipoId ? String(tipoId) : ""}
                        id="tipo"
                        name="tipo"
                    >
                        <option value="">Todos</option>
                        {tipos.map((t) => (
                            <option key={t.cdObj} value={String(t.cdObj)}>
                                {t.nome}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    type="submit"
                >
                    Filtrar
                </button>
                <Link
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
                    href="/producao/analises"
                >
                    Limpar
                </Link>
            </form>

            {/* Tabela */}
            <div className="overflow-hidden rounded-xl border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="bg-surface-secondary text-xs uppercase tracking-wide text-muted">
                            <tr>
                                <th className="px-4 py-3 font-semibold">ID</th>
                                <th className="px-4 py-3 font-semibold">Data / Hora</th>
                                <th className="px-4 py-3 font-semibold">Lote</th>
                                <th className="px-4 py-3 font-semibold">Tipo</th>
                                <th className="px-4 py-3 font-semibold">Responsável</th>
                                <th className="px-4 py-3 text-right font-semibold">Média amêndoa</th>
                                <th className="px-4 py-3 text-right font-semibold">Média casca</th>
                                <th className="px-4 py-3 text-center font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {analises.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-12 text-center text-muted" colSpan={8}>
                                        Nenhuma análise encontrada para os filtros aplicados.
                                    </td>
                                </tr>
                            ) : (
                                analises.map((analise) => (
                                    <tr className="hover:bg-surface-secondary/60" key={analise.id}>
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {analise.id}
                                        </td>
                                        <td className="px-4 py-3 text-muted">
                                            {analise.data} {analise.hora && `· ${analise.hora}`}
                                        </td>
                                        <td className="px-4 py-3 text-foreground">
                                            {analise.loteNome ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-foreground">
                                            {analise.tipoNome ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-foreground">
                                            {analise.responsavelNome ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-foreground">
                                            {formatarNumero(analise.mediaAmendoa)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-foreground">
                                            {formatarNumero(analise.mediaCasca)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link
                                                    aria-label={`Visualizar análise ${analise.id}`}
                                                    className="rounded-md p-1.5 text-muted hover:bg-surface-secondary hover:text-foreground"
                                                    href={`/producao/analises/F3PGI6/${analise.id}`}
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <Link
                                                    aria-label={`Editar análise ${analise.id}`}
                                                    className="rounded-md p-1.5 text-muted hover:bg-surface-secondary hover:text-foreground"
                                                    href={`/producao/analises/F3PGI6/${analise.id}/editar`}
                                                >
                                                    <Pencil size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Paginação */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                    {total === 0
                        ? "Nenhum registro"
                        : `${total} registro${total !== 1 ? "s" : ""} · página ${pagina} de ${totalPaginas}`}
                </p>
                <div className="flex items-center gap-2">
                    {pagina > 1 ? (
                        <Link
                            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-secondary"
                            href={urlComPagina(pagina - 1)}
                        >
                            Anterior
                        </Link>
                    ) : (
                        <span className="rounded-md border border-border px-3 py-1.5 text-sm text-muted opacity-50">
                            Anterior
                        </span>
                    )}
                    {pagina < totalPaginas ? (
                        <Link
                            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-secondary"
                            href={urlComPagina(pagina + 1)}
                        >
                            Próxima
                        </Link>
                    ) : (
                        <span className="rounded-md border border-border px-3 py-1.5 text-sm text-muted opacity-50">
                            Próxima
                        </span>
                    )}
                </div>
            </div>
        </main>
    );
}