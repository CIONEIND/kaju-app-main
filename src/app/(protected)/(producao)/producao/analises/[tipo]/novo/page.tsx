import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { getCurrentUserAccess } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { FORMULARIOS, isTipoFormulario } from "@/lib/analises/formularios";

export default async function NovaAnalisePage({
    params,
}: {
    params: Promise<{ tipo: string }>;
}) {
    const { tipo } = await params;
    const usuario = await getUsuarioAtual();
    if (!usuario) redirect("/login");

    const access = await getCurrentUserAccess();
    if (!access?.permissions.has(PERMISSIONS.ANALISES_MANAGE)) notFound();
    if (!isTipoFormulario(tipo)) notFound();

    const meta = FORMULARIOS[tipo];
    const opcoes = await meta.listarOpcoes();
    const Formulario = meta.componente;

    return (
        <main className="mx-auto max-w-4xl space-y-4 p-6">
            <Formulario
                modo="novo"
                usuario={{ nome: usuario.nome, cdUsrTopManager: usuario.cdUsrTopManager }}
                {...opcoes}
            />
        </main>
    );
}