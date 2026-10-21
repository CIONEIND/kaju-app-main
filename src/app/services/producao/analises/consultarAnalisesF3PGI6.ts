"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import CioneF3PGI6Service from "@/lib/top-manager/service/cione-f3pgi6/cione-f3pgi6.service";
import type { FiltroAnaliseF3PGI6 } from "@/lib/top-manager/repository/cione-f3pgi6/types";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

const service = new CioneF3PGI6Service();

export interface ResultadoListagemF3PGI6 {
  analises: Awaited<ReturnType<CioneF3PGI6Service["listar"]>>;
  total: number;
  lotes: Awaited<ReturnType<CioneF3PGI6Service["listarLotes"]>>;
  tipos: Awaited<ReturnType<CioneF3PGI6Service["listarTipos"]>>;
}

export async function consultarAnalisesF3PGI6(
  filtro: FiltroAnaliseF3PGI6 = {},
): Promise<ResultadoListagemF3PGI6> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada. Faça login novamente.");
    await requirePermission(PERMISSIONS.ANALISES_VIEW);
  const [analises, total, lotes, tipos] = await Promise.all([
    service.listar(filtro),
    service.contar(filtro),
    service.listarLotes(),
    service.listarTipos(),
  ]);

  return { analises, total, lotes, tipos };
}

export async function buscarAnaliseF3PGI6(id: number) {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada. Faça login novamente.");
  return service.buscarPorId(id);
}