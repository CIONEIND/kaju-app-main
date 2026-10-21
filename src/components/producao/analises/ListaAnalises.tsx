import type { AnaliseF3PGI6 } from "@/lib/top-manager/repository/cione-f3pgi6/types";
import { CardAnalise } from "./CardAnalise";

export function ListaAnalises({ analises }: { analises: AnaliseF3PGI6[] }) {
    if (analises.length === 0) {
        return (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
                Nenhuma análise encontrada para os filtros selecionados.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analises.map((analise) => (
                <CardAnalise key={analise.id} analise={analise} />
            ))}
        </div>
    );
}