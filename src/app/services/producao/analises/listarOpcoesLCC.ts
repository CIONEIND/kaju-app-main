"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneLCCService from "@/lib/top-manager/service/cione-lcc/cione-lcc.service";
import type { OpcaoCombo, OpcoesFormulario } from "@/lib/analises/tipos";

const service = new CioneLCCService();

export async function listarOpcoesLCC(): Promise<OpcoesFormulario> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const [lotes, origens] = await Promise.all([
    service.listarLotes(),
    service.listarOrigens(),
  ]);

  return {
    lotes: lotes.map<OpcaoCombo>((l) => ({ valor: String(l.id), rotulo: l.nome })),
    tipos: [],
    origens: origens.map<OpcaoCombo>((o) => ({
      valor: String(o.cdObj),
      rotulo: o.nome,
    })),
  };
}