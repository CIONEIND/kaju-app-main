import type { CardAnaliseDados } from "@/lib/analises/tipos";
import { CardAnalise } from "./CardAnalise";

export function ListaAnalises({
    itens,
    basePath,
    tipo,
}: {
    itens: CardAnaliseDados[];
    basePath: string;
    tipo: string;
}) {
    if (itens.length === 0) {
        return (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
                Nenhuma análise encontrada para os filtros selecionados.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {itens.map((item) => (
                <CardAnalise basePath={basePath} item={item} key={item.id} tipo={tipo} />
            ))}
        </div>
    );
}