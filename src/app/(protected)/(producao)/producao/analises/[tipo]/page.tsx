import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { getCurrentUserAccess } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { FORMULARIOS } from "@/app/services/producao/analises/registry";
import { isTipoFormulario } from "@/lib/analises/registro";
import { FiltrosAnalises } from "@/components/producao/analises/FiltrosAnalises";
import { ListaAnalises } from "@/components/producao/analises/ListaAnalises";
import { Paginacao } from "@/components/producao/analises/Paginacao";
import { SeletorFormulario } from "@/components/producao/analises/SeletorFormulario";
import { NovaAnaliseModal } from "../NovaAnaliseModal";

const POR_PAGINA = 12;

function texto(v: string | string[] | undefined) {
    return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

function numero(v: string | string[] | undefined) {
    if (typeof v !== "string" || v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : undefined;
}

export default async function CentralTipoPage({
    params,
    searchParams,
}: {
    params: Promise<{ tipo: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { tipo } = await params;
    const usuario = await getUsuarioAtual();
    if (!usuario) redirect("/login");

    const access = await getCurrentUserAccess();
    if (!access?.permissions.has(PERMISSIONS.ANALISES_VIEW)) notFound();
    if (!isTipoFormulario(tipo)) notFound();

    const q = await searchParams;
    const dtInicial = texto(q.dt);
    const dtFinal = texto(q.ate);
    const loteId = numero(q.lote);
    const tipoId = numero(q.tipo);
    const siloId = numero(q.silo);
    const pagina = Math.max(1, numero(q.pagina) ?? 1);

    const meta = FORMULARIOS[tipo];
    const basePath = `/producao/analises/${tipo}`;

    const { itens, total, lotes, tipos, silos, resumos } = await meta.consultar({
        dtInicial,
        dtFinal,
        loteId,
        tipoId,
        siloId,
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
        if (siloId) qs.set("silo", String(siloId));
        qs.set("pagina", String(p));
        return `${basePath}?${qs.toString()}`;
    }

    return (
        <main className="mx-auto max-w-7xl space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Produção</p>
                    <h1 className="text-2xl font-semibold text-foreground">Central de análises</h1>
                    <p className="text-sm text-muted">{meta.descricao}</p>
                </div>
                <NovaAnaliseModal />
            </div>

            <SeletorFormulario tipoAtual={tipo} />

            <FiltrosAnalises
                disponiveis={meta.filtros}
                dtInicial={dtInicial}
                dtFinal={dtFinal}
                limparHref={basePath}
                loteId={loteId}
                lotes={lotes}
                siloId={siloId}
                silos={silos}
                tipoId={tipoId}
                tipos={tipos}
            />

            {resumos && resumos.length > 0 && (
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {resumos.map((r) => (
                        <div className="rounded-xl border border-border bg-surface-secondary p-4" key={r.label}>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                                Consumo total
                            </p>
                            <p className="text-lg font-semibold text-foreground">{r.valor}</p>
                            <p className="mt-0.5 truncate text-xs text-muted">{r.label}</p>
                        </div>
                    ))}
                </section>
            )}

            <p className="text-sm text-muted">
                {total === 0
                    ? "Nenhum registro"
                    : `${total} registro${total !== 1 ? "s" : ""} · página ${pagina} de ${totalPaginas}`}
            </p>

            <ListaAnalises basePath={basePath} itens={itens} tipo={tipo} />

            <Paginacao pagina={pagina} totalPaginas={totalPaginas} urlComPagina={urlComPagina} />
        </main>
    );
}