export interface CioneLCCRow {
  ID: number;
  DATAHORA: Date | string;
  Responsavel: number | null;
  Lote: number | null;
  Origem: number | null;
  Viscosidade: number | null;
  Altura: number | null;
  Temperatura: number | null;
}

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
  /** Calculado — não vem da tabela */
  resultado: number | null;
}

export interface ResumoLCC {
  total: number;
  quantidade: number;
}