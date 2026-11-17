"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import CioneF6PGI6Service from "@/lib/top-manager/service/cione-f6pgi6/cione-f6pgi6.service";
import type {
  OpcaoCombo,
  OpcaoSilo,
  OpcoesFormulario,
} from "@/lib/analises/tipos";

const service = new CioneF6PGI6Service();

/**
 * Opções do formulário F6PGI6.
 *
 * Cada silo carrega a geometria vigente para o painel de cálculo ao vivo
 * funcionar sem round-trip a cada tecla. A tag exibida no formulário usa
 * a altura real do banco, nunca um valor fixo.
 */
export async function listarOpcoesF6PGI6(): Promise<OpcoesFormulario> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  const [lotes, tipos, silos] = await Promise.all([
    service.listarLotes(),
    service.listarTipos(),
    service.listarSilos(),
  ]);

  /* Geometria vigente de cada silo — o registro mais recente prevalece */
  const parametros = await prisma.parametroSilo.findMany({
    where: { vigenciaFim: null },
    orderBy: { vigenciaInicio: "desc" },
  });

  const porSilo = new Map<
    number,
    {
      tipoSilo: string;
      alturaUtil: number;
      diametro: number;
      areaBaseMaior: number;
      areaBaseMenor: number;
      alturaTronco: number;
    }
  >();

  for (const p of parametros) {
    /* Já pegou o mais recente deste silo */
    if (porSilo.has(p.siloCdObj)) continue;
    porSilo.set(p.siloCdObj, {
      tipoSilo: String(p.tipoSilo),
      alturaUtil: Number(p.alturaUtil),
      diametro: Number(p.diametro),
      areaBaseMaior: Number(p.areaBaseMaior),
      areaBaseMenor: Number(p.areaBaseMenor),
      alturaTronco: Number(p.alturaTronco),
    });
  }

  const silosComGeometria: OpcaoSilo[] = silos
    .filter((s: { cdObj: number; nome: string }) => porSilo.has(s.cdObj))
    .map((s: { cdObj: number; nome: string }) => {
      const p = porSilo.get(s.cdObj)!;
      return {
        valor: String(s.cdObj),
        rotulo: `${s.nome} — Tipo ${p.tipoSilo}`,
        tipoSilo: p.tipoSilo,
        alturaUtil: p.alturaUtil,
        geometria: {
          alturaUtil: p.alturaUtil,
          diametro: p.diametro,
          areaBaseMaior: p.areaBaseMaior,
          areaBaseMenor: p.areaBaseMenor,
          alturaTronco: p.alturaTronco,
        },
      };
    });

  return {
    lotes: lotes.map<OpcaoCombo>((l: { id: number; nome: string }) => ({
      valor: String(l.id),
      rotulo: l.nome,
    })),
    tipos: tipos.map<OpcaoCombo>((t: { cdObj: number; nome: string }) => ({
      valor: String(t.cdObj),
      rotulo: t.nome,
    })),
    silos: silosComGeometria,
    origens: [],
  };
}