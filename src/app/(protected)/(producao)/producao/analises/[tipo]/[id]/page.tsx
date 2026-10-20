import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarioAtual } from "@/lib/auth/auth";
import {
    buscarAnaliseMock,
    type ResultadoAnalise,
} from "@/lib/analises/mockStore";
import { FORMULARIOS, isTipoFormulario } from "@/lib/analises/formularios";

const BADGES: Record<ResultadoAnalise, string> = {
    aprovado: "bg-green-100 text-green-800",
    reprovado: "bg-red-100 text-red-800",
    pendente: "bg-amber-100 text-amber-800",
};

export default async function DetalheAnalisePage({
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

    const { titulo } = FORMULARIOS[tipo];

    return (
        <main className="mx-auto max-w-4xl space-y-4 p-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h1 className="text-lg font-semibold text-gray-900">
                        Análise {titulo} — Lote {analise.lote}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Registrada por {analise.responsavelNome} (CdUsr{" "}
                        {analise.responsavelCdUsr})
                    </p>
                </div>

                <dl className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-medium uppercase text-gray-400">Lote</dt>
                        <dd className="text-sm text-gray-900">{analise.lote}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase text-gray-400">
                            Tipo de análise
                        </dt>
                        <dd className="text-sm text-gray-900">{analise.tipoAnalise}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase text-gray-400">Data</dt>
                        <dd className="text-sm text-gray-900">{analise.dataAnalise}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase text-gray-400">Hora</dt>
                        <dd className="text-sm text-gray-900">{analise.horaAnalise ?? "—"}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase text-gray-400">
                            Resultado
                        </dt>
                        <dd>
                            <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGES[analise.resultado]}`}
                            >
                                {analise.resultado}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase text-gray-400">
                            Observações
                        </dt>
                        <dd className="text-sm text-gray-900">
                            {analise.observacoes ?? "—"}
                        </dd>
                    </div>
                </dl>
            </div>

            <div className="flex items-center gap-2">
                <Link
                    href={`/producao/analises/${tipo}/${id}/editar`}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Editar análise
                </Link>
                <Link
                    href="/producao/analises"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Voltar à lista
                </Link>
            </div>
        </main>
    );
}