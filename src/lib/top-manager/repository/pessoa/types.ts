

export interface Pessoa {
    CdPes?: number;
    NmPes?: string;
    TpPes?: number; // 1 - cliente
    TipoDeRegistro?: number // default  1
    TipoDePessoa?: number // 1 - pessoa juridica; 2 - pessoa física
    Sexo?: number // default 0 
    FlPesPro?: number // default 0
    NrPesCpj?: number // cpf ou cnpj
    NrPesCgf?: string // rg
    CdLlg?: number
    CdLgr?: number
    CdLoc?: number
    NrPesEdr?: string // numero do logradouro
    NrPesEdrCep?: string // cep do endereco
    CdAve?: number // 84 - mercado interno; 85 - mercado externo
    PessoaTransportadora?: number // default 0
    EstabelecimentoTransportador?: number // default 0
    NrPesNiv?: number // default 1
    CdPes001?: number // recebe o valor de CdPes
}