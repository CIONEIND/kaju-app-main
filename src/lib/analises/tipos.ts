export interface OpcaoCombo {
  valor: string;
  rotulo: string;
}

export interface FiltroCentral {
  dtInicial?: string;
  dtFinal?: string;
  loteId?: number;
  tipoId?: number;
  siloId?: number;
  origemId?: number;   // novo
  limite?: number;
  offset?: number;
}

/** O que o card da Central precisa — independente do formulário */
export interface CardAnaliseDados {
  id: number;
  titulo: string;
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

export interface OpcoesFormulario {
  lotes: OpcaoCombo[];
  tipos: OpcaoCombo[];
  silos?: OpcaoCombo[];
  origens?: OpcaoCombo[];  // novo
}

export interface ResultadoCentral {
  itens: CardAnaliseDados[];
  total: number;
  lotes: OpcaoCombo[];
  tipos: OpcaoCombo[];
  silos?: OpcaoCombo[];
  origens?: OpcaoCombo[];  // novo
  resumos?: { label: string; valor: string }[];
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
  dadosIniciais?: any;
  usuario: { nome: string; cdUsrTopManager: number | null };
  lotes: OpcaoCombo[];
  tipos: OpcaoCombo[];
  silos?: OpcaoCombo[];
  origens?: OpcaoCombo[];
}