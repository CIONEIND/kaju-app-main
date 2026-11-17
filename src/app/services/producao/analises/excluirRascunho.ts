"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF6PGI6Service from "@/lib/top-manager/service/cione-f6pgi6/cione-f6pgi6.service";

const service = new CioneF6PGI6Service();

export interface ResultadoExclusao {
  ok: boolean;
  erro?: string;
}

/**
 * Exclui um rascunho do próprio usuário.
 *
 * Só rascunho pode ser excluído — análise concluída é registro de produção
 * e não se apaga. Só o dono do rascunho pode excluir.
 */
export async function excluirRascunhoF6PGI6(
  id: number,
): Promise<ResultadoExclusao> {
  const usuario = await getUsuarioAtual();
  if (!usuario) return { ok: false, erro: "Sessão expirada." };
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  if (usuario.cdUsrTopManager === null) {
    return { ok: false, erro: "Usuário sem vínculo com o TopManager." };
  }

  const analise = await service.buscarPorId(id);
  if (!analise) return { ok: false, erro: "Rascunho não encontrado." };

  /* 0 = rascunho */
  if (analise.status !== 0) {
    return { ok: false, erro: "Apenas rascunhos podem ser excluídos." };
  }

  if (analise.responsavelCdUsr !== usuario.cdUsrTopManager) {
    return { ok: false, erro: "Você só pode excluir seus próprios rascunhos." };
  }

    try {
    const removidas = await service.excluir(id);
    if (removidas === 0) {
      return { ok: false, erro: "Rascunho não encontrado." };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      erro: e instanceof Error ? e.message : "Erro ao excluir o rascunho.",
    };
  }
}