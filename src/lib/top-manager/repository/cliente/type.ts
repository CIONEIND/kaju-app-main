export interface Cliente {
  CdCli?: number;
  NmCli?: string;
  TpCliNiv?: number; // default 4
  CdPes?: number; // referencia a tabela Pessoa
  CdAve?: number; // 84 - mercado interno; 85 - mercado externo
  QtCliEnt?: number; // default 0
  CdInf?: number; // tipo de moeda aceito pelo cliente: 1 - Real; 2 - Dólar; 3 - Euro
  FlCliNaoAtv?: number; //default 0
  FlCliTcb?: number; // default 0
  DtCliInc?: string; // data criacao registro
  CdCliMae?: number; //  3 - mercado interno; 261 - mercado externo/ 292 - filiais
  CdCliMat?: number; // mesmo valor de CdCli
  NrCliNiv?: number; // 3 - para qualquer empresa meno filial; 4 - para filial
  CdCli001?: number; // default 2
  CdCli002?: number; // default 3
  CdCli003?: number; // 292 se NrCliNiv for 4(filial), caso contrário é o mesmo que CdCli
  CdCli004?: number; // preencher somente se NrCliNiv for 4 e preencher com o valor de CdCli
  NrCliOrd001?: number; // default 1
  NrCliOrd002?: number; // default 1
  NrCliOrd003?: number; // valor do ultimo registro + 1
  NrCliOrd004?: number; // preencher somente se NrCliNiv for 4: valor do ultimo registro + 1
}

export interface ClienteConsultaItem {
  codCliente: number;
  nome: string;
  cpfCnpj: string;
}

export interface ClienteConsultaPage {
  items: ClienteConsultaItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ClienteConsultaFilters {
  search: string;
  page: number;
  pageSize: number;
}

export interface ClienteDetalhe {
  codCliente: number;
  codPessoa: number;
  nomePessoa: string;
  cpfCnpj: string;
  rg: string;
  tipoPessoa: "1" | "2";
  cdAve: "84" | "85";
  cdInf: "1" | "5" | "6";
  isBrazil: boolean;
  country: string;
  postalCode: string;
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
}

export interface ClienteUpdateInput {
  nomePessoa: string;
  cpfCnpj: string;
  rg: string;
  tipoPessoa: "1" | "2";
  cdAve: "84" | "85";
  cdInf: "1" | "5" | "6";
  cdLlg: number;
  cdLgr: number;
  cdLoc: number;
  numLogradouro: string;
  cep: string;
}
