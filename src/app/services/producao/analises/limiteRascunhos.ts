
import { getUsuarioAtual } from "@/lib/auth/auth";

export const RASCUNHOS_MAXIMOS = 2;

export interface VerificacaoLimite {
  permitido: boolean;
  quantidade: number;
  erro?: string;
}

export async function verificarLimiteRascunhos(
  contar: (cdUsr: number) => Promise<number>,
): Promise<VerificacaoLimite> {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.cdUsrTopManager === null) {
    return { permitido: false, quantidade: 0, erro: "Sessão expirada." };
  }

  const quantidade = await contar(usuario.cdUsrTopManager);

  if (quantidade >= RASCUNHOS_MAXIMOS) {
    return {
      permitido: false,
      quantidade,
      erro: `Limite de ${RASCUNHOS_MAXIMOS} rascunhos atingido. Conclua ou exclua um rascunho antes de criar outro.`,
    };
  }

  return { permitido: true, quantidade };
}