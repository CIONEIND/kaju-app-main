import { Pencil, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { buscarAnaliseF3PGI6 } from "@/app/services/producao/analises/consultarAnalisesF3PGI6";
import { isTipoFormulario } from "@/lib/analises/formularios";
import { getCurrentUserAccess } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

function formatarNumero(valor: number | null): string {
    if (valor === null) return "—";
    return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function LinhaMedicoes({
    titulo,
    t1,
    t2,
    t3,
    media,
}: {
    titulo: string;
    t1: number | null;
    t2: number | null;
    t3: number | null;
    media: number | null;
}) {
    return (
        <div className="rounded-lg border border-border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                {titulo}
            </p>
            <dl className="grid grid-cols-3 gap-3">
                <div>
                    <dt className="text-xs text-muted">Teste 1</dt>
                    <dd className="text-sm font-semibold text-foreground">
                        {formatarNumero(t1)}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-muted">Teste 2</dt>
                    <dd className="text-sm font-semibold text-foreground">
                        {formatarNumero(t2)}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-muted">Teste 3</dt>
                    <dd className="text-sm font-semibold text-foreground">
                        {formatarNumero(t3)}
                    </dd>
                </div>
            </dl>
            <div className="mt-3 flex items-center justify-between rounded-md bg-surface-secondary px-3 py-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    Média
                </span>
                <span className="text-sm font-semibold text-foreground">
                    {formatarNumero(media)}
                </span>
            </div>
        </div>
    );
}

export default async function DetalheAnalisePage({
    params,
}: {
    params: Promise<{ tipo: string; id: string }>;
}) {
    const { tipo, id } = await params;
    const usuario = await getUsuarioAtual();
    if (!usuario) redirect("/login");
    const access = await getCurrentUserAccess();
    if (!access?.permissions.has(PERMISSIONS.ANALISES_VIEW)) notFound();

    if (!isTipoFormulario(tipo)) notFound();
    const idNumero = Number(id);
    if (!Number.isInteger(idNumero) || idNumero <= 0) notFound();

    const analise = await buscarAnaliseF3PGI6(idNumero);
    if (!analise) notFound();

    return (
        <main className="mx-auto max-w-5xl space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                        Produção
                    </p>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Análise {tipo} #{analise.id}
                    </h1>
                    <p className="text-sm text-muted">
                        Registrada por {analise.responsavelNome ?? "—"} ·{" "}
                        {analise.data}
                        {analise.hora && ` · ${analise.hora}`}
                    </p>
                </div>
                <Link
                    className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    href={`/producao/analises/${tipo}/${analise.id}/editar`}
                >
                    <Pencil size={16} />
                    Editar análise
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                        Identificação
                    </p>
                    <dl className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between gap-2">
                            <dt className="text-muted">Lote</dt>
                            <dd className="font-medium text-foreground">
                                {analise.loteNome ?? "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-muted">Tipo</dt>
                            <dd className="font-medium text-foreground">
                                {analise.tipoNome ?? "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-muted">Responsável</dt>
                            <dd className="font-medium text-foreground">
                                {analise.responsavelNome ?? "—"}
                            </dd>
                        </div>
                    </dl>
                </div>

                <LinhaMedicoes
                    titulo="Amêndoa"
                    t1={analise.t1Amendoa}
                    t2={analise.t2Amendoa}
                    t3={analise.t3Amendoa}
                    media={analise.mediaAmendoa}
                />
                <LinhaMedicoes
                    titulo="Casca"
                    t1={analise.t1Casca}
                    t2={analise.t2Casca}
                    t3={analise.t3Casca}
                    media={analise.mediaCasca}
                />
            </div>

            <Link
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
                href="/producao/analises"
            >
                <ArrowLeft size={16} />
                Voltar à central
            </Link>
        </main>
    );
}