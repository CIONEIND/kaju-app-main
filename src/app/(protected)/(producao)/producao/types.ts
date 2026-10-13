// src/app/(producao)/producao/types.ts
export type Processo = "CAST" | "AMEND";

export interface Analise {
  id: string;
  tipoCodigo: string;       // F3PGI6, F6PGI6, LCC, PUREZA
  tipoNome: string;
  processo: Processo;
  lote: string;
  dataHora: string;         // ISO
  operador: string;
  status: "CONCLUIDA" | "RASCUNHO";
}

export interface TipoFormulario {
  codigo: string;
  nome: string;
  processo: Processo;
}