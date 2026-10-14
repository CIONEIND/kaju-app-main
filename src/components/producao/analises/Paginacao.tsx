// src/app/(producao)/producao/components/Paginacao.tsx
"use client";

interface Props {
    pagina: number;
    totalPaginas: number;
    onPagina: (p: number) => void;
}

export function Paginacao({ pagina, totalPaginas, onPagina }: Props) {
    if (totalPaginas <= 1) return null;

    // Janela de páginas: atual ±1, com primeira e última fixadas
    const paginas = new Set<number>([1, totalPaginas, pagina - 1, pagina, pagina + 1]);
    const ordenadas = [...paginas].filter((p) => p >= 1 && p <= totalPaginas).sort((a, b) => a - b);

    return (
        <nav className="flex items-center justify-center gap-1 pt-2" aria-label="Paginação">
            <button
                onClick={() => onPagina(pagina - 1)}
                disabled={pagina === 1}
                className="rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
                Anterior
            </button>

            {/* Números: escondidos no mobile para economizar espaço */}
            <div className="hidden items-center gap-1 sm:flex">
                {ordenadas.map((p, i) => (
                    <span key={p} className="flex items-center">
                        {i > 0 && p - ordenadas[i - 1] > 1 && <span className="px-1 text-gray-400">…</span>}
                        <button
                            onClick={() => onPagina(p)}
                            className={`h-8 w-8 rounded-lg text-sm ${p === pagina
                                ? "bg-blue-600 text-white"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            {p}
                        </button>
                    </span>
                ))}
            </div>

            {/* Indicador compacto só no mobile */}
            <span className="px-2 text-sm text-gray-500 sm:hidden">
                {pagina} de {totalPaginas}
            </span>

            <button
                onClick={() => onPagina(pagina + 1)}
                disabled={pagina === totalPaginas}
                className="rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
                Próxima
            </button>
        </nav>
    );
}