import type { StatusAnalise } from "@/lib/analises/tipos";

/** Linha crua da tabela CIONE_F6PGI6 (dbo) */
export interface CioneF6PGI6Row {
  ID: number;
  DATAHORA: Date | string;
  Responsavel: number | null;
  Lote: number | null;
  Silo: number | null;
  Tipo: number | null;
  Cubagem: number | null;
  Consumo: number | null;
  /** 0 = rascunho · 1 = concluída (NOT NULL DEFAULT 1) */
  Status: number;
}

/** Registro normalizado: 1 linha por análise, data/hora já em texto */
export interface AnaliseF6PGI6 {
  id: number;
  data: string;
  hora: string;
  responsavelCdUsr: number | null;
  responsavelNome: string | null;
  loteId: number | null;
  loteNome: string | null;
  siloId: number | null;
  siloNome: string | null;
  tipoId: number | null;
  tipoNome: string | null;
  cubagem: number | null;
  consumo: number | null;
  /** 0 = rascunho · 1 = concluída */
  status: number;
}

export interface ResumoF6PGI6 {
  tipoId: number | null;
  tipoNome: string | null;
  loteId: number | null;
  loteNome: string | null;
  consumototal: number;
  qtdSilos: number;
}

export interface FiltroAnaliseF6PGI6 {
  dtInicial?: string;
  dtFinal?: string;
  loteId?: number;
  tipoId?: number;
  siloId?: number;
  status?: StatusAnalise;
  /** Injetado pela action quando o status é rascunho */
  responsavelCdUsr?: number;
  limite?: number;
  offset?: number;
}