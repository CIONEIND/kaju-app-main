

export interface CreatePessoaDTO {
    NmPes?: string;
    TipoDePessoa?: number // 1 - pessoa juridica; 2 - pessoa física
    CdLlg?: number
    CdLgr?: number
    CdLoc?: number
    NrPesEdr?: string // numero do logradouro
    NrPesEdrCep?: string // cep do endereco
    CdAve?: number // 84 - mercado interno; 85 - mercado externo
}