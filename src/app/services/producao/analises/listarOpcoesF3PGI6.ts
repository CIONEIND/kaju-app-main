"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF3PGI6Service from "@/lib/top-manager/service/cione-f3pgi6/cione-f3pgi6.service";

const service = new CioneF3PGI6Service();

export interface OpcoesF3PGI6 {
  lotes: { id: number; nome: string }[];
  tipos: { cdObj: number; nome: string }[];
}

export async function listarOpcoesF3PGI6(): Promise<OpcoesF3PGI6> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada. Faça login novamente.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);
  const [lotes, tipos] = await Promise.all([
    service.listarLotes(),
    service.listarTipos(),
  ]);

  return { lotes, tipos };
}