"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ResultadoRascunho = {
  ok: boolean;
  id?: number;
  erro?: string;
};

export function useRascunho<T>({
  habilitado,
  dados,
  idAtual,
  salvar,
  onId,
  atraso = 1200,
}: {
  habilitado: boolean;
  dados: T;
  idAtual: number | null;
  salvar: (dados: T, id: number | null) => Promise<ResultadoRascunho>;
  onId: (id: number) => void;
  atraso?: number;
}) {
  const [salvando, setSalvando] = useState(false);
  const [ultimoSalvo, setUltimoSalvo] = useState<Date | null>(null);

  // refs: evitam que o efeito re-dispare quando as funções mudam de identidade
  const salvarRef = useRef(salvar);
  const onIdRef = useRef(onId);
  const idRef = useRef(idAtual);
  const ocupado = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  salvarRef.current = salvar;
  onIdRef.current = onId;
  idRef.current = idAtual;

  const serializado = JSON.stringify(dados);

  const cancelar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    if (!habilitado) return;

    cancelar();
    timer.current = setTimeout(async () => {
      if (ocupado.current) return;
      ocupado.current = true;
      setSalvando(true);
      try {
        const r = await salvarRef.current(
          JSON.parse(serializado) as T,
          idRef.current,
        );
        if (r.ok) {
          if (r.id && r.id !== idRef.current) onIdRef.current(r.id);
          setUltimoSalvo(new Date());
        }
      } finally {
        ocupado.current = false;
        setSalvando(false);
      }
    }, atraso);

    return cancelar;
  }, [serializado, habilitado, atraso, cancelar]);

  return { salvando, ultimoSalvo, cancelar };
}