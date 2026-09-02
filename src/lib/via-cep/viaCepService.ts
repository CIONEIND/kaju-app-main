import { ViaCepError, ViaCepResponse } from "./types";

const API_URL = 'https://viacep.com.br'

export default async function getCep(cep: string): Promise<ViaCepResponse> {
    try {
        const sanitizedCep = cep.replace(/\D/g, "");
        const parsedUrl = new URL(`${API_URL}/ws/${sanitizedCep}/json`)
        const response = await fetch(parsedUrl);
        let body: any = await response.json();

        if (!response.ok) {
            console.error("[VIA-CEP-API] Erro inesperado ao consumir api");
            console.error("[VIA-CEP-API] Request failed", {
                status: response.status,
                statusText: response.statusText,
                body,
            });

            throw new ViaCepError(
                "Erro ao consultar CEP",
                response.status,
                body
            );
        }

        if (body.erro) {
            throw new ViaCepError("CEP não encontrado", 404);
        }

        return body;
    } catch (err) {
        if (err instanceof ViaCepError) {
            throw err;
        }

        console.error("[VIA-CEP-API] Erro inesperado ao consumir api", err);

        throw new ViaCepError("Erro inesperado")
    }

}