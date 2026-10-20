import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { LOTES_MOCK, TIPOS_MOCK } from "@/lib/analises/mockStore";
import { FORMULARIOS, isTipoFormulario } from "@/lib/analises/formularios";

export default async function NovaAnalisePage({
    params,
}: {
    params: Promise<{ tipo: string }>;
}) {
    const { tipo } = await params;
    const usuario = await getUsuarioAtual();
    if (!usuario) redirect("/login");

    // Fase 3: restringir por permissão do catálogo (ex.: ANALISES_CREATE)
    if (!isTipoFormulario(tipo)) notFound();

    const { componente: Formulario } = FORMULARIOS[tipo];

    return (
        <main className="mx-auto max-w-4xl space-y-4 p-6">
            <Formulario
                modo="novo"
                usuario={{ nome: usuario.nome, cdUsrTopManager: usuario.cdUsrTopManager }}
                lotes={LOTES_MOCK}
                tipos={TIPOS_MOCK}
            />
        </main>
    );
}