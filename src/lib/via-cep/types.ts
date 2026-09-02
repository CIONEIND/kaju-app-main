export class ViaCepError extends Error {
    constructor(
        message?: string,
        public responseStatus?: number,
        public details?: unknown
    ) {
        super(message);
        this.name = "ViaCepError";
    }
}

export type ViaCepResponse = {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    estado: string;
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
    erro?: boolean;
};