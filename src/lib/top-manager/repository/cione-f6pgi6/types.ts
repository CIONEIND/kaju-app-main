import type { StatusAnalise } from "@/lib/analises/tipos";

/** Linha crua da tabela CIONE_F6PGI6 (dbo) */
export interface CioneF6PGI6Row {
  ID: number;

  /** Momento da leitura inicial */
  DataHoraInicial: Date | string;
  /** Momento da leitura final — nulo enquanto o ciclo não fecha */
  DataHoraFinal: Date | string | null;

  Responsavel: number | null;
  Lote: number | null;
  Silo: number | null;
  Tipo: number | null;

  VazioInicial: number | null;
  VazioFinal: number | null;

  /** Dia de processamento — derivado da leitura inicial */
  Competencia: Date | string | null;

  /** 0 = vazio · 1 = produto */
  ModoMedicao: number;

  VolumeInicial: number | null;
  VolumeFinal: number | null;
  PesoInicial: number | null;
  PesoFinal: number | null;
  VolumeConsumido: number | null;
  PesoConsumido: number | null;

  /** 0 = rascunho · 1 = concluída */
  Status: number;
}

/** Registro normalizado: 1 linha por análise, data/hora já em texto */
export interface AnaliseF6PGI6 {
  id: number;
  data: string;
  hora: string;
  dataFinal: string | null;
  horaFinal: string | null;
  responsavelCdUsr: number | null;
  responsavelNome: string | null;
  loteId: number | null;
  loteNome: string | null;
  siloId: number | null;
  siloNome: string | null;
  tipoId: number | null;
  tipoNome: string | null;

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