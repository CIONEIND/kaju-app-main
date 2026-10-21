"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF6PGI6Service from "@/lib/top-manager/service/cione-f6pgi6/cione-f6pgi6.service";
import type { OpcaoCombo, OpcoesFormulario } from "@/lib/analises/tipos";

const service = new CioneF6PGI6Service();

export async function listarOpcoesF6PGI6(): Promise<OpcoesFormulario> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const [lotes, tipos, silos] = await Promise.all([
    service.listarLotes(),
    service.listarTipos(),
    service.listarSilos(),
  ]);

  return {
    lotes: lotes.map<OpcaoCombo>((l) => ({
      valor: String(l.id),
      rotulo: l.nome,
    })),
    tipos: tipos.map<OpcaoCombo>((t) => ({
      valor: String(t.cdObj),
      rotulo: t.nome,
    })),
    silos: silos.map<OpcaoCombo>((s) => ({
      valor: String(s.cdObj),
      rotulo: s.nome,
    })),
  };
}