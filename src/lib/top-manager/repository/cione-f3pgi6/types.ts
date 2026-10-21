/** Linha crua da tabela CIONE_F3PGI6 (dbo) */
export interface CioneF3PGI6Row {
  ID: number;
  DATAHORA: Date | string;
  Responsavel: number | null;
  Lote: number | null;
  Tipo: number | null;
  t1Amendoa: number | null;
  t2Amendoa: number | null;
  t3Amendoa: number | null;
  t1Casca: number | null;
  t2Casca: number | null;
  t3Casca: number | null;
}

/** Registro normalizado: 1 linha por análise, data/hora já em texto */
export interface AnaliseF3PGI6 {
  id: number;
  data: string; // "YYYY-MM-DD"
  hora: string; // "HH:mm"
  responsavelCdUsr: number | null;
  responsavelNome: string | null;
  loteId: number | null;
  loteNome: string | null;
  tipoId: number | null;
  tipoNome: string | null;
  t1Amendoa: number | null;
  t2Amendoa: number | null;
  t3Amendoa: number | null;
  t1Casca: number | null;
  t2Casca: number | null;
  t3Casca: number | null;
  mediaAmendoa: number | null;
  mediaCasca: number | null;
}

export interface LoteSemanalOpcao {
  id: number;
  nome: string;
}

export interface TipoObjetoOpcao {
  cdObj: number;
  nome: string;
}

export interface FiltroAnaliseF3PGI6 {
  dtInicial?: string; // YYYY-MM-DD
  dtFinal?: string;   // YYYY-MM-DD
  loteId?: number;
  tipoId?: number;
  responsavelCdUsr?: number;
  limite?: number;
  offset?: number;
}