export type StatusAnalise = "concluida" | "rascunho";
export interface OpcaoCombo {
  valor: string;
  rotulo: string;
}

export interface FiltroCentral {
  dtInicial?: string;
  dtFinal?: string;
  status?: StatusAnalise;
  loteId?: number;
  tipoId?: number;
  siloId?: number;
  origemId?: number;
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
  dadosIniciais: any;
}
export interface DadosIniciaisAnalise {
  id?: number;
  data?: string;
  hora?: string;
  loteId?: number | null;
  tipoId?: number | null;
  siloId?: number | null;
  origemId?: number | null;
  // F3PGI6
  t1Amendoa?: number | null;
  t2Amendoa?: number | null;
  t3Amendoa?: number | null;
  t1Casca?: number | null;
  t2Casca?: number | null;
  t3Casca?: number | null;
  // F6PGI6
  cubagem?: number | null;
  consumo?: number | null;
  // LCC
  viscosidade?: number | null;
  altura?: number | null;
  temperatura?: number | null;
  status?: StatusAnalise;
}

export interface OpcoesFormulario {
  lotes: OpcaoCombo[];
  tipos: OpcaoCombo[];
  silos?: OpcaoCombo[];
  origens?: OpcaoCombo[];
}

export interface ResultadoCentral {
  itens: CardAnaliseDados[];
  total: number;
  lotes: OpcaoCombo[];
  tipos: OpcaoCombo[];
  silos?: OpcaoCombo[];
  origens?: OpcaoCombo[];
  resumos?: { label: string; valor: string }[];
  status?: StatusAnalise;
}

export interface FiltrosDisponiveis {
  periodo?: boolean;
  lote?: boolean;
  tipo?: boolean;
  silo?: boolean;
  origem?: boolean;
}


export interface FormularioBaseProps {
  modo?: "novo" | "editar";
  tipo?: string;
  dadosIniciais?: DadosIniciaisAnalise;
  usuario: { nome: string; cdUsrTopManager: number | null };
  lotes: OpcaoCombo[];
  tipos: OpcaoCombo[];
  silos?: OpcaoCombo[];
  origens?: OpcaoCombo[];
}

