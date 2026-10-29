"use client";

import { sanitizarDecimal, finalizarDecimal } from "@/lib/analises/numerico";

interface CampoNumericoProps {
    id?: string;
    value: string;
    onChange: (valor: string) => void;
    decimais?: number;
    permitirNegativo?: boolean;
    placeholder?: string;
    sufixo?: string;
    className?: string;
}

export function CampoNumerico({
    id,
    value,
    onChange,
    decimais = 2,
    permitirNegativo = false,
    placeholder = "0,00",
    sufixo,
    className = "",
}: CampoNumericoProps) {
    return (
        <div className="relative">
            <input
                id={id}
                // type="text" e não "number": o number ignora a vírgula no pt-BR,
                // mostra setinhas e bloqueia a máscara.
                type="text"
                inputMode="decimal"       // abre teclado numérico com separador
                enterKeyHint="next"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                pattern="[0-9]*[.,]?[0-9]*"
                // text-base no mobile evita o zoom automático do iOS (que dispara < 16px)
                className={`w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-base outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm ${sufixo ? "pr-10" : ""
                    } ${className}`}
                value={value}
                onChange={(e) =>
                    onChange(sanitizarDecimal(e.target.value, decimais, permitirNegativo))
                }
                onBlur={() => {
                    if (value.trim() !== "") onChange(finalizarDecimal(value, decimais));
                }}
                placeholder={placeholder}
            />
            {sufixo && (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
                    {sufixo}
                </span>
            )}
        </div>
    );
}