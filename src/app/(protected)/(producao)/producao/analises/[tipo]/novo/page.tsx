import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { FORMULARIOS, isTipoFormulario } from "@/lib/analises/formularios";
import { listarOpcoesF3PGI6 } from "@/app/services/producao/analises/listarOpcoesF3PGI6";
import { getCurrentUserAccess } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function NovaAnalisePage({
    params,
}: {
    params: Promise<{ tipo: string }>;
}) {
    const { tipo } = await params;
    const usuario = await getUsuarioAtual();
    if (!usuario) redirect("/login");
    const access = await getCurrentUserAccess();
    if (!access?.permissions.has(PERMISSIONS.ANALISES_VIEW)) notFound();

    // Fase 5: adicionar gate de permissão (ANALISES_MANAGE)
    if (!isTipoFormulario(tipo)) notFound();

    const { componente: Formulario } = FORMULARIOS[tipo];
    const { lotes, tipos } = await listarOpcoesF3PGI6();

    return (
        <main className="mx-auto max-w-4xl space-y-4 p-6">
            <Formulario
                modo="novo"
                usuario={{
                    nome: usuario.nome,
                    cdUsrTopManager: usuario.cdUsrTopManager,
                }}
                lotes={lotes.map((l) => ({ valor: String(l.id), rotulo: l.nome }))}
                tipos={tipos.map((t) => ({ valor: String(t.cdObj), rotulo: t.nome }))}
            />
        </main>
    );
}