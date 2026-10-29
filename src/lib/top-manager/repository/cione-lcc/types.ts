import type { StatusAnalise } from "@/lib/analises/tipos";

/** Linha crua da tabela CIONE_ResultadoLCCDiario (dbo) */
export interface CioneLCCRow {
  ID: number;
  DATAHORA: Date | string;
  Responsavel: number | null;
  Lote: number | null;
  Origem: number | null;
  Viscosidade: number | null;
  Altura: number | null;
  Temperatura: number | null;
  /** 0 = rascunho · 1 = concluída (NOT NULL DEFAULT 1) */
  Status: number;
}

/** Registro normalizado: 1 linha por análise, data/hora já em texto */
export interface AnaliseLCC {
  id: number;
  data: string;
  hora: string;
  responsavelCdUsr: number | null;
  responsavelNome: string | null;
  loteId: number | null;
  loteNome: string | null;
  origemId: number | null;
  origemNome: string | null;
  viscosidade: number | null;
  altura: number | null;
  temperatura: number | null;
  /** 0 = rascunho · 1 = concluída */
  status: number;
  /** Calculado — não vem da tabela */
  resultado: number | null;
}

export interface ResumoLCC {
  total: number;
  quantidade: number;
}

/** ⚠️ Este arquivo não tinha filtro — adicionado agora */
export interface FiltroAnaliseLCC {
  dtInicial?: string;
  dtFinal?: string;
  loteId?: number;
  origemId?: number;
  status?: StatusAnalise;
  /** Injetado pela action quando o status é rascunho */
  responsavelCdUsr?: number;
  limite?: number;
  offset?: number;
}