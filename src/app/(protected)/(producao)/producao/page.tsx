// src/app/(producao)/producao/page.tsx
import { redirect } from "next/navigation";
// import { getUsuarioAtual } from "@/lib/auth"; // ← ADAPTAR: aponte para a sessão existente do app
import { ListaAnalises } from "@/components/producao/analises/ListaAnalises";
import { listarAnalisesMock } from "@/lib/analises/mockStore";

export const metadata = { title: "Produção | Kaju App" };

export default async function ProducaoPage() {
    // ADAPTAR: getUsuarioAtual deve retornar { nome, email, role }
    // const usuario = await getUsuarioAtual();

    //if (!usuario) redirect("/login");
    //if (usuario.role !== "ADMIN") redirect("/"); // Fase 2+: incluir SUPERVISOR_PRODUCAO e OPERADOR_PRODUCAO

    // dentro da página:
    const analises = listarAnalisesMock();
    return (
        <main className="space-y-6 p-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Produção</h1>
                <p className="text-sm text-gray-500">
                    Central de análises — últimas análises e novos registros
                </p>
            </header>

            {/* ADMIN tem permissão total nesta fase */}
            <ListaAnalises podeEditar podeExcluir />
        </main>
    );
}