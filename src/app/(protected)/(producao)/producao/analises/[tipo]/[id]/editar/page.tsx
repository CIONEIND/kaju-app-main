import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { getCurrentUserAccess } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { FORMULARIOS, isTipoFormulario } from "@/lib/analises/formularios";

export default async function EditarAnalisePage({
    params,
}: {
    params: Promise<{ tipo: string; id: string }>;
}) {
    const { tipo, id } = await params;
    const usuario = await getUsuarioAtual();
    if (!usuario) redirect("/login");

    const access = await getCurrentUserAccess();
    if (!access?.permissions.has(PERMISSIONS.ANALISES_MANAGE)) notFound();
    if (!isTipoFormulario(tipo)) notFound();

    const idNumero = Number(id);
    if (!Number.isInteger(idNumero) || idNumero <= 0) notFound();

    const meta = FORMULARIOS[tipo];
    const [detalhe, opcoes] = await Promise.all([
        meta.carregar(idNumero),
        meta.listarOpcoes(),
    ]);
    if (!detalhe) notFound();

    const Formulario = meta.componente;

    return (
        <main className="mx-auto max-w-4xl space-y-4 p-6">
            <Formulario
                modo="editar"
                dadosIniciais={detalhe.dadosIniciais}
                usuario={{ nome: usuario.nome, cdUsrTopManager: usuario.cdUsrTopManager }}
                {...opcoes}
            />
        </main>
    );
}