"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF5PGI6Service from "@/lib/top-manager/service/cione-f5pgi6/cione-f5pgi6.service";
import type { SalvarAnaliseF5PGI6SchemaType } from "@/lib/top-manager/service/cione-f5pgi6/schemas";

const service = new CioneF5PGI6Service();

export interface ResultadoSalvarF5PGI6 {
  ok: boolean;
  id?: number;
  erro?: string;
}

export async function salvarAnaliseF5PGI6(
  dto: SalvarAnaliseF5PGI6SchemaType,
  id?: number | null,
): Promise<ResultadoSalvarF5PGI6> {
  const usuario = await getUsuarioAtual();
  if (!usuario) return { ok: false, erro: "Sessão expirada." };

  const permissao =
    dto.status === "rascunho"
      ? PERMISSIONS.ANALISES_VIEW
      : PERMISSIONS.ANALISES_SEND;
  await requirePermission(permissao);

  if (usuario.cdUsrTopManager === null) {
    return { ok: false, erro: "Usuário sem vínculo com o TopManager." };
  }

  /* O responsável é sempre o usuário logado — nunca vem do cliente */
  const payload: SalvarAnaliseF5PGI6SchemaType = {
    ...dto,
    responsavelCdUsr: usuario.cdUsrTopManager,
  };

  try {
    const r = id
      ? await service.atualizar(id, payload)
      : await service.criar(payload);

    revalidatePath("/producao/analises");
    revalidatePath("/producao/analises/f5pgi6");

    return { ok: true, id: r.id };
  } catch (e) {
    return {
      ok: false,
      erro: e instanceof Error ? e.message : "Erro ao salvar a análise.",
    };
  }
}