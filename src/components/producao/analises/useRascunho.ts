"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface DadosRascunho {
  lote: string;
  silo: string;
  tipoId: string;
  dataInicial: string;
  horaInicial: string;
  dataFinal: string;
  horaFinal: string;
  modoMedicao: "vazio" | "produto";
  medicoes: {
    vazioInicial: string;
    vazioFinal: string;
  };
}

export interface ResultadoSalvarRascunho {
  ok: boolean;
  id?: number;
  erro?: string;
}

interface UseRascunhoParams {
  habilitado: boolean;
  dados: DadosRascunho;
  idAtual: number | null;
  salvar: (
    dados: DadosRascunho,
    id: number | null,
  ) => Promise<ResultadoSalvarRascunho>;
  onId: (id: number) => void;
  debounceMs?: number;
}

interface UseRascunhoRetorno {
  salvando: boolean;
  ultimoSalvo: Date | null;
  cancelar: () => void;
}

/**
 * Salva o rascunho automaticamente após o usuário parar de digitar.
 *
 * - Só dispara quando `habilitado` é true.
 * - Não dispara se os dados não mudaram desde o último salvamento.
 * - Reaproveita o `idAtual` para atualizar em vez de criar novo registro.
 * - `cancelar()` limpa o timer pendente antes de concluir a análise,
 *   evitando que um rascunho sobrescreva o registro já concluído.
 */
export function useRascunho({
  habilitado,
  dados,
  idAtual,
  salvar,
  onId,
  debounceMs = 1200,
}: UseRascunhoParams): UseRascunhoRetorno {
  const [salvando, setSalvando] = useState(false);
  const [ultimoSalvo, setUltimoSalvo] = useState<Date | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimaAssinatura = useRef<string>("");
  const salvandoRef = useRef(false);

  const assinatura = JSON.stringify(dados);

  const cancelar = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!habilitado) {
      cancelar();
      return;
    }
    if (assinatura === ultimaAssinatura.current) return;
    if (salvandoRef.current) return;

    cancelar();

    timer.current = setTimeout(async () => {
      salvandoRef.current = true;
      setSalvando(true);

      try {
        const r = await salvar(dados, idAtual);
        if (r.ok) {
          ultimaAssinatura.current = assinatura;
          setUltimoSalvo(new Date());
          if (r.id !== undefined && r.id !== idAtual) onId(r.id);
        }
      } finally {
        salvandoRef.current = false;
        setSalvando(false);
      }
    }, debounceMs);

    return cancelar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura, habilitado, idAtual, debounceMs]);

  useEffect(() => cancelar, [cancelar]);

  return { salvando, ultimoSalvo, cancelar };
}