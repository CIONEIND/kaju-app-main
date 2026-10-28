import Link from "next/link";
import { FORMULARIOS } from "@/app/services/producao/analises/registry";

export function SeletorFormulario({ tipoAtual }: { tipoAtual: string }) {
    return (
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
            {Object.entries(FORMULARIOS).map(([tipo, meta]) => {
                const ativo = tipo === tipoAtual;
                return (
                    <Link
                        key={tipo}
                        href={`/producao/analises/${tipo}`}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${ativo
                            ? "bg-accent text-white"
                            : "text-muted hover:bg-surface-secondary hover:text-foreground"
                            }`}
                    >
                        {meta.titulo}
                    </Link>
                );
            })}
        </div>
    );
}