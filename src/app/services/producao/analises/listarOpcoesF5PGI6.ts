"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF5PGI6Service from "@/lib/top-manager/service/cione-f5pgi6/cione-f5pgi6.service";
import type { OpcaoSilo, OpcoesFormulario } from "@/lib/analises/tipos";

const service = new CioneF5PGI6Service();

export async function listarOpcoesF5PGI6(): Promise<OpcoesFormulario> {
  const usuario = await getUsuarioAtual();
  if (!usuario) {
    return { lotes: [], tipos: [], silos: [], origens: [] };
  }
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const [lotes, tipos, silos, origens] = await Promise.all([
    service.listarLotes(),
    service.listarTipos(),
    service.listarSilos(),
    service.listarOrigens(),
  ]);

  return {
    lotes: lotes.map((l) => ({ valor: String(l.id), rotulo: l.nome })),
    tipos: tipos.map((t) => ({ valor: String(t.cdObj), rotulo: t.nome })),
    /* O F5PGI6 não usa geometria de silo — os campos exigidos por
       OpcaoSilo vão com valores neutros para satisfazer o contrato. */
    silos: silos.map(
      (s): OpcaoSilo => ({
        valor: String(s.cdObj),
        rotulo: s.nome,
        tipoSilo: "—",
        alturaUtil: 0,
        geometria: {
          alturaUtil: 0,
          diametro: 0,
          areaBaseMaior: 0,
          areaBaseMenor: 0,
          alturaTronco: 0,
        },
      }),
    ),
    origens: origens.map((o) => ({ valor: String(o.cdObj), rotulo: o.nome })),
  };
}