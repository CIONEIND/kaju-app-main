export interface CioneF6PGI6Row {
  ID: number;
  DATAHORA: Date | string;
  Responsavel: number | null;
  Lote: number | null;
  Silo: number | null;
  Tipo: number | null;
  Cubagem: number | null;
  Consumo: number | null;
}

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
  limite?: number;
  offset?: number;
}