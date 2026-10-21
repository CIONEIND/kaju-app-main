import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { getCurrentUserAccess } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { consultarAnalisesF3PGI6 } from "@/app/services/producao/analises/consultarAnalisesF3PGI6";
import { FiltrosAnalises } from "@/components/producao/analises/FiltrosAnalises";
import { ListaAnalises } from "@/components/producao/analises/ListaAnalises";
import { Paginacao } from "@/components/producao/analises/Paginacao";
import { NovaAnaliseModal } from "./NovaAnaliseModal";

const POR_PAGINA = 12; // 4 linhas × 3 colunas na grade

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

            <FiltrosAnalises
                dtInicial={dtInicial}
                dtFinal={dtFinal}
                loteId={loteId}
                tipoId={tipoId}
                lotes={lotes}
                tipos={tipos}
            />

            <p className="text-sm text-muted">
                {total === 0
                    ? "Nenhum registro"
                    : `${total} registro${total !== 1 ? "s" : ""} · página ${pagina} de ${totalPaginas}`}
            </p>

            <ListaAnalises analises={analises} />

            <Paginacao pagina={pagina} totalPaginas={totalPaginas} urlComPagina={urlComPagina} />
        </main>
    );
}