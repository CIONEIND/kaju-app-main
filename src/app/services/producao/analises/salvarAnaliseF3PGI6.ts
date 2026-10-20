"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import {
  atualizarAnaliseMock,
  criarAnaliseMock,
} from "@/lib/analises/mockStore";

export interface SalvarAnaliseF3PGI6Input {
  /** Presente = edição; ausente = criação */
  id?: string;
  lote: string;
  tipoAnalise: string;
  dataAnalise: string;
  horaAnalise?: string;
  resultado: "aprovado" | "reprovado" | "pendente";
  observacoes?: string;
}

export type SalvarAnaliseF3PGI6Resultado =
  | { ok: true; id: string }
  | { ok: false; erro: string };

export async function salvarAnaliseF3PGI6(
  input: SalvarAnaliseF3PGI6Input,
): Promise<SalvarAnaliseF3PGI6Resultado> {
  try {
    const usuario = await getUsuarioAtual();
    if (!usuario)
      return { ok: false, erro: "Sessão expirada. Faça login novamente." };
    if (usuario.cdUsrTopManager === null)
      return {
        ok: false,
        erro: "Usuário sem vínculo com o TopManager. Peça ao administrador.",
      };
    if (!input.lote) return { ok: false, erro: "Selecione o lote." };
    if (!input.tipoAnalise)
      return { ok: false, erro: "Selecione o tipo de análise." };
    if (!input.dataAnalise) return { ok: false, erro: "Informe a data." };

    // Edição
    if (input.id) {
      const atualizada = atualizarAnaliseMock(input.id, {
        lote: input.lote,
        tipoAnalise: input.tipoAnalise,
        dataAnalise: input.dataAnalise,
        horaAnalise: input.horaAnalise,
        resultado: input.resultado,
        observacoes: input.observacoes,
      });
      if (!atualizada) return { ok: false, erro: "Análise não encontrada." };
      return { ok: true, id: atualizada.id };
    }

    // Criação
    const criada = criarAnaliseMock({
      tipo: "F3PGI6",
      lote: input.lote,
      tipoAnalise: input.tipoAnalise,
      dataAnalise: input.dataAnalise,
      horaAnalise: input.horaAnalise,
      resultado: input.resultado,
      observacoes: input.observacoes,
      responsavelCdUsr: usuario.cdUsrTopManager,
      responsavelNome: usuario.nome,
    });

    return { ok: true, id: criada.id };
  } catch (error) {
    console.error("[salvarAnaliseF3PGI6]", error);
    return { ok: false, erro: "Erro inesperado ao salvar a análise." };
  }
}