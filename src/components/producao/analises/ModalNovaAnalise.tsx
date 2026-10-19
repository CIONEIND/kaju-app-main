// src/app/(producao)/producao/components/ModalNovaAnalise.tsx
"use client";

import { useRouter } from "next/navigation";
import { TIPOS_FORMULARIO } from "@/mocks/mock-analises";

interface Props {
    aberto: boolean;
    onFechar: () => void;
}

export function ModalNovaAnalise({ aberto, onFechar }: Props) {
    const router = useRouter();
    if (!aberto) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onFechar}>
            <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-gray-900">Selecione o formulário</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Escolha o tipo de análise que deseja preencher.
                </p>

                <ul className="mt-4 space-y-2">
                    {TIPOS_FORMULARIO.map((t) => (
                        <li key={t.codigo}>
                            <button
                                onClick={() => router.push(`/producao/analises/${t.codigo}/novo`)}
                                className="w-full rounded-lg border px-4 py-3 text-left text-sm font-medium hover:border-blue-500 hover:bg-blue-50"
                            >
                                {t.nome}
                                <span className="ml-2 text-xs text-gray-400">{t.processo}</span>
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="mt-5 flex justify-end">
                    <button onClick={onFechar} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}