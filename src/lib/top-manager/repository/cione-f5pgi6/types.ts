export interface AnaliseF5PGI6 {
  id: number;
  data: string;
  hora: string;
  responsavelCdUsr: number | null;
  responsavelNome: string | null;
  status: number;
  loteId: number | null;
  loteNome: string | null;
  siloId: number | null;
  siloNome: string | null;
  tipoId: number | null;
  tipoNome: string | null;
  origemId: number | null;
  origemNome: string | null;
  t1Amendoa: number | null;
  t2Amendoa: number | null;
  t3Amendoa: number | null;
  t1Casca: number | null;
  t2Casca: number | null;
  t3Casca: number | null;
  /** Média calculada de t1, t2 e t3 da amêndoa */
  mediaAmendoa: number | null;
  /** Média calculada de t1, t2 e t3 da casca */
  mediaCasca: number | null;
}

export interface CioneF5PGI6Row {
  ID: number;
  DATAHORA: Date;
  Responsavel: number | null;
  Lote: number | null;
  Silo: number | null;
  Tipo: number | null;
  Origem: number | null;
  t1Amendoa: number | null;
  t2Amendoa: number | null;
  t3Amendoa: number | null;
  t1Casca: number | null;
  t2Casca: number | null;
  t3Casca: number | null;
  Status: number | null;
}

export interface FiltroAnaliseF5PGI6 {
  dtInicial?: string;
  dtFinal?: string;
  loteId?: number;
  tipoId?: number;
  siloId?: number;
  origemId?: number;
  responsavelCdUsr?: number;
  status?: "concluida" | "rascunho";
  limite?: number;
  offset?: number;
}

export interface LoteSemanalOpcao {
  id: number;
  nome: string;
}

export interface TipoObjetoOpcao {
  cdObj: number;
  nome: string;
}

export interface SiloOpcao {
  cdObj: number;
  nome: string;
}

export interface OrigemOpcao {
  cdObj: number;
  nome: string;
}