import type { StatusAnalise } from "@/lib/analises/tipos";

/** 1 = concluída · 0 = rascunho */
export type StatusTinyint = 0 | 1;

/** 0 = vazio · 1 = produto */
export type ModoMedicaoTinyint = 0 | 1;

/** Linha crua da tabela CIONE_F6PGI6 (dbo) */
export interface CioneF6PGI6Row {
  ID: number;
  DATAHORA: Date | string;
  Responsavel: number | null;
  Lote: number | null;
  Silo: number | null;
  Tipo: number | null;
  /** Nível de vazio no início do ciclo, em metros */
  VazioInicial: number | null;
  /** Nível de vazio no fim do ciclo, em metros */
  VazioFinal: number | null;
  /** Data de competência da análise */
  Competencia: Date | string | null;
  /** 0 = vazio · 1 = produto (NOT NULL) */
  ModoMedicao: number;
  VolumeInicial: number | null;
  VolumeFinal: number | null;
  PesoInicial: number | null;
  PesoFinal: number | null;
  VolumeConsumido: number | null;
  PesoConsumido: number | null;
  /** 0 = concluída · 1 = rascunho (NOT NULL) */
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
  /** 0 = concluída · 1 = rascunho */
  status: number;

  /* ── Ciclo de consumo ── */
  vazioInicial: number | null;
  vazioFinal: number | null;
  competencia: string | null;
  modoMedicao: "vazio" | "produto";
  volumeInicial: number | null;
  volumeFinal: number | null;
  pesoInicial: number | null;
  pesoFinal: number | null;
  volumeConsumido: number | null;
  pesoConsumido: number | null;
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