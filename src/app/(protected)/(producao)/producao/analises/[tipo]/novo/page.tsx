// src/app/(protected)/(producao)/producao/analises/[tipo]/novo/page.tsx
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { FormularioF3PGI6 } from "@/components/producao/analises/FormularioF3PGI6";

const LOTES_MOCK = [
    { valor: "1024", rotulo: "Lote Semana 41 — 1024" },
    { valor: "1025", rotulo: "Lote Semana 41 — 1025" },
    { valor: "1018", rotulo: "Lote Semana 40 — 1018" },
    { valor: "1012", rotulo: "Lote Semana 39 — 1012" },
];

const TIPOS_MOCK = [
    { valor: "12", rotulo: "Amostra Padrão — 12" },
    { valor: "15", rotulo: "Contratipo — 15" },
    { valor: "18", rotulo: "Amostra Cliente — 18" },
];

export default async function NovaAnalisePage({
    params,
}: {
    params: Promise<{ tipo: string }>;
}) {
    const { tipo } = await params;
    const usuario = await getUsuarioAtual();

    if (!usuario) redirect("/login");
    if (usuario.role !== "ADMIN") redirect("/");

    if (tipo !== "F3PGI6") {
        return (
            <main className="p-6">
                <h1 className="text-xl font-semibold text-gray-900">Formulário {tipo}</h1>
                <p className="mt-2 text-sm text-gray-500">
                    Em construção — será implementado na Fase 2.
                </p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-4xl space-y-4 p-6">
            <FormularioF3PGI6
                usuario={{ nome: usuario.nome, cdUsrTopManager: usuario.cdUsrTopManager }}
                lotes={LOTES_MOCK}
                tipos={TIPOS_MOCK}
            />
        </main>
    );
}