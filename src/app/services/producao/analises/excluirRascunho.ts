"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF3PGI6Service from "@/lib/top-manager/service/cione-f3pgi6/cione-f3pgi6.service";
import CioneF5PGI6Service from "@/lib/top-manager/service/cione-f5pgi6/cione-f5pgi6.service";
import CioneF6PGI6Service from "@/lib/top-manager/service/cione-f6pgi6/cione-f6pgi6.service";
import CioneLCCService from "@/lib/top-manager/service/cione-lcc/cione-lcc.service";

export interface ResultadoExclusao {
  ok: boolean;
  erro?: string;
}

const SERVICES = {
  F3PGI6: new CioneF3PGI6Service(),
  F5PGI6: new CioneF5PGI6Service(),
  F6PGI6: new CioneF6PGI6Service(),
  LCC: new CioneLCCService(),
} as const;

export type TipoFormularioExclusao = keyof typeof SERVICES;

export async function excluirRascunho(
  tipo: TipoFormularioExclusao,
  id: number,
): Promise<ResultadoExclusao> {
  const usuario = await getUsuarioAtual();
  if (!usuario) return { ok: false, erro: "Sessão expirada." };
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  if (usuario.cdUsrTopManager === null) {
    return { ok: false, erro: "Usuário sem vínculo com o TopManager." };
  }

  const service = SERVICES[tipo];
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