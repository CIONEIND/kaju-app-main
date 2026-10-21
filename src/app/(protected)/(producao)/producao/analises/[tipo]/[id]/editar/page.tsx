import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { FORMULARIOS, isTipoFormulario } from "@/lib/analises/formularios";
import { buscarAnaliseF3PGI6 } from "@/app/services/producao/analises/consultarAnalisesF3PGI6";
import { listarOpcoesF3PGI6 } from "@/app/services/producao/analises/listarOpcoesF3PGI6";
import { getCurrentUserAccess } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function EditarAnalisePage({
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

    const [analise, { lotes, tipos }] = await Promise.all([
        buscarAnaliseF3PGI6(idNumero),
        listarOpcoesF3PGI6(),
    ]);
    if (!analise) notFound();

    const { componente: Formulario } = FORMULARIOS[tipo];

    return (
        <main className="mx-auto max-w-4xl space-y-4 p-6">
            <Formulario
                modo="editar"
                dadosIniciais={{
                    id: analise.id,
                    data: analise.data,
                    hora: analise.hora,
                    loteId: analise.loteId,
                    tipoId: analise.tipoId,
                    t1Amendoa: analise.t1Amendoa,
                    t2Amendoa: analise.t2Amendoa,
                    t3Amendoa: analise.t3Amendoa,
                    t1Casca: analise.t1Casca,
                    t2Casca: analise.t2Casca,
                    t3Casca: analise.t3Casca,
                }}
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