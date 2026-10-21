"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF3PGI6Service from "@/lib/top-manager/service/cione-f3pgi6/cione-f3pgi6.service";
import type { OpcaoCombo, OpcoesFormulario } from "@/lib/analises/tipos";

const service = new CioneF3PGI6Service();

export async function listarOpcoesF3PGI6(): Promise<OpcoesFormulario> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const [lotes, tipos] = await Promise.all([
    service.listarLotes(),
    service.listarTipos(),
  ]);

  const comboLotes: OpcaoCombo[] = lotes.map((l) => ({
    valor: String(l.id),
    rotulo: l.nome,
  }));

  const comboTipos: OpcaoCombo[] = tipos.map((t) => ({
    valor: String(t.cdObj),
    rotulo: t.nome,
  }));

  return { lotes: comboLotes, tipos: comboTipos };
}