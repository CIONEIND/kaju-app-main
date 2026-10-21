import Link from "next/link";

export function Paginacao({
    pagina,
    totalPaginas,
    urlComPagina,
}: {
    pagina: number;
    totalPaginas: number;
    urlComPagina: (p: number) => string;
}) {
    if (totalPaginas <= 1) return null;

    return (
        <nav className="flex items-center justify-between gap-3">
            {pagina > 1 ? (
                <Link
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-secondary"
                    href={urlComPagina(pagina - 1)}
                >
                    Anterior
                </Link>
            ) : (
                <span className="rounded-md border border-border px-3 py-1.5 text-sm text-muted opacity-50">
                    Anterior
                </span>
            )}

            <span className="text-sm text-muted">
                página {pagina} de {totalPaginas}
            </span>

            {pagina < totalPaginas ? (
                <Link
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-secondary"
                    href={urlComPagina(pagina + 1)}
                >
                    Próxima
                </Link>
            ) : (
                <span className="rounded-md border border-border px-3 py-1.5 text-sm text-muted opacity-50">
                    Próxima
                </span>
            )}
        </nav>
    );
}