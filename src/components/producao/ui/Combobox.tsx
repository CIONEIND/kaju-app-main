"use client";

import { useEffect, useRef, useState } from "react";

export interface ComboboxOption {
    valor: string;
    rotulo: string;
}

interface Props {
    opcoes: ComboboxOption[];
    valor: string;
    onChange: (valor: string) => void;
    placeholder?: string;
    erro?: boolean;
}

export function Combobox({ opcoes, valor, onChange, placeholder, erro }: Props) {
    const [aberto, setAberto] = useState(false);
    const [busca, setBusca] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selecionado = opcoes.find((o) => o.valor === valor);

    // Fecha ao clicar fora
    useEffect(() => {
        function fora(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setAberto(false);
            }
        }
        document.addEventListener("mousedown", fora);
        return () => document.removeEventListener("mousedown", fora);
    }, []);

    const termo = busca.trim().toLowerCase();
    const filtradas = termo
        ? opcoes.filter((o) => o.rotulo.toLowerCase().includes(termo))
        : opcoes;

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    setAberto((a) => !a);
                    setBusca("");
                }}
                className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-sm outline-none focus:ring-2 focus:ring-blue-500 ${erro ? "border-red-400" : "border-gray-300"
                    }`}
            >
                <span className={selecionado ? "text-gray-900" : "text-gray-400"}>
                    {selecionado?.rotulo ?? placeholder ?? "Selecione..."}
                </span>
                <span className="text-gray-400">▾</span>
            </button>

            {aberto && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow-lg">
                    <input
                        autoFocus
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full border-b px-3 py-2 text-sm outline-none"
                    />
                    <ul className="max-h-56 overflow-y-auto">
                        {filtradas.length === 0 ? (
                            <li className="px-3 py-3 text-sm text-gray-400">Nenhum resultado encontrado</li>
                        ) : (
                            filtradas.map((o) => (
                                <li key={o.valor}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange(o.valor);
                                            setAberto(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${o.valor === valor ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700"
                                            }`}
                                    >
                                        {o.rotulo}
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}