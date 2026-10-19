"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";

export interface SalvarAnaliseF3PGI6Input {
  lote: string;
  tipoAnalise: string;
  dataAnalise: string;
  horaAnalise?: string;
  resultado: "aprovado" | "reprovado" | "pendente";
  observacoes?: string;
}

export type SalvarAnaliseF3PGI6Resultado =
  | { ok: true }
  | { ok: false; erro: string };

export async function salvarAnaliseF3PGI6(
  input: SalvarAnaliseF3PGI6Input,
): Promise<SalvarAnaliseF3PGI6Resultado> {
  try {
    const usuario = await getUsuarioAtual();
    if (!usuario)
      return { ok: false, erro: "Sessão expirada. Faça login novamente." };
    if (usuario.role !== "ADMIN")
      return { ok: false, erro: "Sem permissão para registrar análises." };
    if (usuario.cdUsrTopManager === null)
      return {
        ok: false,
        erro: "Usuário sem vínculo com o TopManager. Peça ao administrador.",
      };
    if (!input.lote) return { ok: false, erro: "Selecione o lote." };
    if (!input.tipoAnalise) return { ok: false, erro: "Selecione o tipo de análise." };
    if (!input.dataAnalise) return { ok: false, erro: "Informe a data." };

    // Fase 3: INSERT na CIONE_F3PGI6 via src/lib/top-manager
    // responsavelCdUsr: usuario.cdUsrTopManager
    console.log("[salvarAnaliseF3PGI6]", {
      ...input,
      responsavelCdUsr: usuario.cdUsrTopManager,
    });

    return { ok: true };
  } catch (error) {
    console.error("[salvarAnaliseF3PGI6]", error);
    return { ok: false, erro: "Erro inesperado ao salvar a análise." };
  }
}