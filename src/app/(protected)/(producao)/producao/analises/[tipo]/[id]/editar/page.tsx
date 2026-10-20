import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import {
    buscarAnaliseMock,
    LOTES_MOCK,
    TIPOS_MOCK,
} from "@/lib/analises/mockStore";
import { FORMULARIOS, isTipoFormulario } from "@/lib/analises/formularios";

export default async function EditarAnalisePage({
    params,
}: {
    params: Promise<{ tipo: string; id: string }>;
}) {
    const { tipo, id } = await params;
    const usuario = await getUsuarioAtual();
    if (!usuario) redirect("/login");

    if (!isTipoFormulario(tipo)) notFound();
    const analise = buscarAnaliseMock(id);
    if (!analise || analise.tipo !== tipo) notFound();

    const { componente: Formulario } = FORMULARIOS[tipo];

    return (
        <main className="mx-auto max-w-4xl space-y-4 p-6">
            <Formulario
                modo="editar"
                dadosIniciais={{
                    id: analise.id,
                    lote: analise.lote,
                    tipoAnalise: analise.tipoAnalise,
                    dataAnalise: analise.dataAnalise,
                    horaAnalise: analise.horaAnalise,
                    resultado: analise.resultado,
                    observacoes: analise.observacoes,
                }}
                usuario={{ nome: usuario.nome, cdUsrTopManager: usuario.cdUsrTopManager }}
                lotes={LOTES_MOCK}
                tipos={TIPOS_MOCK}
            />
        </main>
    );
}