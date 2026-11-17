import type { GeometriaSilo, ModoMedicao } from "./calculo-silo";
import type { TabelaReferencia } from "./referencia-silo";

export type StatusAnalise = "concluida" | "rascunho";

export interface OpcaoCombo {
  valor: string;
  rotulo: string;
}

/** Silo com a geometria vigente — usada pelo painel ao vivo */
export interface OpcaoSilo extends OpcaoCombo {
  tipoSilo: string;
  alturaUtil: number;
  geometria: GeometriaSilo;
}

export interface FiltrosDisponiveis {
  periodo?: boolean;
  lote?: boolean;
  tipo?: boolean;
  silo?: boolean;
  origem?: boolean;
}

export interface FiltroCentral {
  dtInicial?: string;
  dtFinal?: string;
  status?: StatusAnalise;
  loteId?: number;
  tipoId?: number;
  siloId?: number;
  origemId?: number;
  /** Tipo de silo (I, II, III) — usado pela tabela de referência */
  tipoSilo?: string;
  /** Interno: injetado pela action ao filtrar rascunhos. Nunca vem da URL. */
  responsavelCdUsr?: number;
  limite?: number;
  offset?: number;
}

/** O que o card da Central precisa — independente do formulário */
export interface CardAnaliseDados {
  id: number;
  titulo: string;
  status?: StatusAnalise;
  linhas: { label: string; valor: string }[];
  metricas: { label: string; valor: string }[];
}

/** O que a página Ver precisa — independente do formulário */
export interface DetalheAnalise {
  id: number;
  titulo: string;
  subtitulo: string;
  identificacao: { label: string; valor: string }[];
  grupos: { titulo: string; itens: { label: string; valor: string }[] }[];
  dadosIniciais: DadosIniciaisAnalise;
}

export interface DadosIniciaisAnalise {
  id?: number;
  loteId?: number | null;
  tipoId?: number | null;
  siloId?: number | null;
  origemId?: number | null;
  modoMedicao?: ModoMedicao;

  /* F6PGI6 — leitura inicial e final */
  dataInicial?: string;
  horaInicial?: string;
  vazioInicial?: number | null;

  dataFinal?: string;
  horaFinal?: string;
  vazioFinal?: number | null;

  /* F3PGI6 — data/hora única + amostras de amêndoa e casca */
  data?: string;
  hora?: string;
  t1Amendoa?: number | null;
  t2Amendoa?: number | null;
  t3Amendoa?: number | null;
  t1Casca?: number | null;
  t2Casca?: number | null;
  t3Casca?: number | null;

  /* LCC — parâmetros de processo */
  viscosidade?: number | null;
  altura?: number | null;
  temperatura?: number | null;

  status?: StatusAnalise;
}

export interface OpcoesFormulario {
  lotes: OpcaoCombo[];
  tipos: OpcaoCombo[];
  silos?: OpcaoSilo[];
  origens?: OpcaoCombo[];
}

/* ── Impacto nas estatísticas (item 6) ─────────────────────── */

export interface ImpactoTipo {
  tipoId: number;
  tipoNome: string;
  volume: number;
  peso: number;
  /** Participação percentual no total geral (0-100) */
  participacao: number;
}

export interface ImpactoDia {
  /** Data em formato ISO (yyyy-mm-dd) */
  data: string;
  /** Data já formatada em dd/mm/aaaa */
  dataBR: string;
  volume: number;
  peso: number;
  /** Tipos processados naquele dia */
  tipos: { tipoNome: string; volume: number; peso: number }[];
}

export interface ImpactoEstatisticas {
  /** Período do filtro, já formatado em dd/mm/aaaa */
  periodo: string;
  /** Todos os tipos processados no período, ordenados por volume desc */
  tipos: ImpactoTipo[];
  /** Apenas os dias com produção, em ordem crescente */
  dias: ImpactoDia[];
  totalGeral: { volume: number; peso: number };
  abertura: { volume: number; peso: number; vazio: number };
  /** true quando o período tem mais de um dia — muda o rótulo para "acumulado" */
  acumulado: boolean;
  /** Quantos dias do intervalo tiveram produção */
  diasComProducao: number;
  /** Quantos dias o intervalo tem no total */
  diasNoPeriodo: number;
}

/* ── Resultado da central ──────────────────────────────────── */

export interface ResultadoCentral {
  itens: CardAnaliseDados[];
  total: number;
  lotes: OpcaoCombo[];
  tipos: OpcaoCombo[];
  silos?: OpcaoCombo[];
  origens?: OpcaoCombo[];
  resumos?: { label: string; valor: string }[];
  status?: StatusAnalise;
  periodo?: string;
  impacto?: ImpactoEstatisticas | null;
  /** Tabelas de referência de todos os tipos de silo (I a VII) */
  referencias?: TabelaReferencia[];
}

export interface FormularioBaseProps {
  modo?: "novo" | "editar";
  tipo?: string;
  dadosIniciais?: DadosIniciaisAnalise;
  usuario: { nome: string; cdUsrTopManager: number | null };
  lotes: OpcaoCombo[];
  tipos: OpcaoCombo[];
  silos?: OpcaoSilo[];
  origens?: OpcaoCombo[];
}