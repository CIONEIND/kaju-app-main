import { useCallback, useEffect, useRef, useState } from "react";

interface ResultadoSalvar {
    ok: boolean;
    id?: number;
    erro?: string;
}

interface UseRascunhoProps<TDados> {
    habilitado: boolean;
    dados: TDados;
    idAtual: number | null;
    salvar: (dados: TDados, id: number | null) => Promise<ResultadoSalvar>;
    onId: (id: number) => void;
    /** Intervalo do debounce em ms */
    intervalo?: number;
}

export function useRascunho<TDados>({
    habilitado,
    dados,
    idAtual,
    salvar,
    onId,
    intervalo = 1500,
}: UseRascunhoProps<TDados>) {
    const [salvando, setSalvando] = useState(false);
    const [ultimoSalvo, setUltimoSalvo] = useState<Date | null>(null);

    /* Refs para não reiniciar o timer a cada render */
    const dadosRef = useRef(dados);
    const idRef = useRef(idAtual);
    const salvarRef = useRef(salvar);
    const onIdRef = useRef(onId);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const canceladoRef = useRef(false);

    dadosRef.current = dados;
    idRef.current = idAtual;
    salvarRef.current = salvar;
    onIdRef.current = onId;

    const cancelar = useCallback(() => {
        canceladoRef.current = true;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!habilitado) return;

        canceladoRef.current = false;

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(async () => {
            if (canceladoRef.current) return;
            setSalvando(true);
            try {
                const r = await salvarRef.current(dadosRef.current, idRef.current);
                if (canceladoRef.current) return;
                if (r.ok && r.id !== undefined) {
                    onIdRef.current(r.id);
                    setUltimoSalvo(new Date());
                }
            } finally {
                if (!canceladoRef.current) setSalvando(false);
            }
        }, intervalo);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [habilitado, dados, intervalo]);

    return { salvando, ultimoSalvo, cancelar };
}