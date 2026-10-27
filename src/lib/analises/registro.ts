import type { FiltrosDisponiveis } from "./tipos";

export const REGISTRO_META = {
  F3PGI6: {
    titulo: "F3PGI6",
    descricao: "Umidade da Matéria-Prima para Processo",
    filtros: { periodo: true, lote: true, tipo: true } as FiltrosDisponiveis,
  },
  F6PGI6: {
    titulo: "F6PGI6",
    descricao: "Contabilização da Matéria-Prima Processada",
    filtros: { periodo: true, lote: true, tipo: true, silo: true } as FiltrosDisponiveis,
  },
  LCC: {
    titulo: "LCC",
    descricao: "Resultado LCC diário — viscosidade, altura e temperatura",
    filtros: { periodo: true, lote: true, origem: true } as FiltrosDisponiveis,
  },
} as const;

export type TipoFormulario = keyof typeof REGISTRO_META;

export const TIPOS_FORMULARIO = Object.keys(REGISTRO_META) as TipoFormulario[];
export const TIPO_PADRAO: TipoFormulario = "F3PGI6";

export function isTipoFormulario(valor: string): valor is TipoFormulario {
  return valor in REGISTRO_META;
}