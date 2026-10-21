"use server";

import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF3PGI6Service from "@/lib/top-manager/service/cione-f3pgi6/cione-f3pgi6.service";
import type { FiltroAnaliseF3PGI6 } from "@/lib/top-manager/repository/cione-f3pgi6/types";

const service = new CioneF3PGI6Service();

export async function listarAnalisesF3PGI6(filtro: FiltroAnaliseF3PGI6 = {}) {
  await requirePermission(PERMISSIONS.ANALISES_VIEW);;
  return service.listar(filtro);
}

export async function buscarAnaliseF3PGI6(id: number) {
  await requirePermission(PERMISSIONS.ANALISES_VIEW);
  return service.buscarPorId(id);
}