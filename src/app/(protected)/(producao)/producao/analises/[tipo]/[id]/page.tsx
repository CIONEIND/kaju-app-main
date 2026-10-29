import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { getCurrentUserAccess } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { FORMULARIOS } from "@/app/services/producao/analises/registry";
import { isTipoFormulario } from "@/lib/analises/registro";

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

    const detalhe = await FORMULARIOS[tipo].carregar(idNumero);
    if (!detalhe) notFound();

    return (
        <main className="mx-auto max-w-5xl space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Produção</p>
                    <h1 className="text-2xl font-semibold text-foreground">{detalhe.titulo}</h1>
                    <p className="text-sm text-muted">{detalhe.subtitulo}</p>
                </div>
                <Link
                    className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    href={`/producao/analises/${tipo}/${detalhe.id}/editar`}
                >
                    <Pencil size={16} />
                    Editar análise
                </Link>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Identificação</p>
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {detalhe.identificacao.map((i) => (
                        <div className="flex justify-between gap-2" key={i.label}>
                            <dt className="text-muted">{i.label}</dt>
                            <dd className="font-medium text-foreground">{i.valor}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {detalhe.grupos.map((g) => (
                    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm" key={g.titulo}>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{g.titulo}</p>
                        <dl className="grid grid-cols-2 gap-3">
                            {g.itens.map((i) => (
                                <div key={i.label}>
                                    <dt className="text-xs text-muted">{i.label}</dt>
                                    <dd className="text-sm font-semibold text-foreground">{i.valor}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ))}
            </div>

            <Link
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
                href={`/producao/analises/${tipo}`}
            >
                <ArrowLeft size={16} />
                Voltar à central
            </Link>
        </main>
    );
}