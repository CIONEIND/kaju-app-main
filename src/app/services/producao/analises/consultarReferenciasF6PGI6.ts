"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import CioneF6PGI6Service from "@/lib/top-manager/service/cione-f6pgi6/cione-f6pgi6.service";
import {
  montarTabelaReferencia,
  type PesoColuna,
  type TabelaReferencia,
} from "@/lib/analises/referencia-silo";
import type { GeometriaSilo } from "@/lib/analises/calculo-silo";

const service = new CioneF6PGI6Service();

const ROTULOS: Record<number, string> = {
  52913: "21",
  52914: "23",
  52916: "25",
  52917: "28",
};

const TIPOS_SILO = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

interface SiloOpcao {
  cdObj: number;
  nome: string;
}

/**
 * Tabelas de referência de todos os tipos de silo.
 *
 * Carrega geometria e pesos uma única vez e monta as sete tabelas em
 * memória — o seletor de tipo alterna sem round-trip ao servidor.
 */
export async function consultarReferenciasF6PGI6(): Promise<TabelaReferencia[]> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  /* Todos os parâmetros vigentes, o mais recente por silo */
  const parametros = await prisma.parametroSilo.findMany({
    where: { vigenciaFim: null },
    orderBy: { vigenciaInicio: "desc" },
  });

  const porSilo = new Map<
    number,
    { tipoSilo: string; geometria: GeometriaSilo }
  >();
  for (const p of parametros) {
    if (porSilo.has(p.siloCdObj)) continue;
    porSilo.set(p.siloCdObj, {
      tipoSilo: String(p.tipoSilo),
      geometria: {
        alturaUtil: Number(p.alturaUtil),
        diametro: Number(p.diametro),
        areaBaseMaior: Number(p.areaBaseMaior),
        areaBaseMenor: Number(p.areaBaseMenor),
        alturaTronco: Number(p.alturaTronco),
      },
    });
  }

  /* Pesos específicos vigentes */
  const pesosDb = await prisma.pesoEspecifico.findMany({
    where: { vigenciaFim: null },
    orderBy: { tipoAnaliseCdObj: "asc" },
  });

  const pesos: PesoColuna[] = pesosDb
    .filter(
      (p: { tipoAnaliseCdObj: number }) =>
        ROTULOS[p.tipoAnaliseCdObj] !== undefined,
    )
    .map((p: { tipoAnaliseCdObj: number; valorKgM3: unknown }) => ({
      tipoAnaliseCdObj: p.tipoAnaliseCdObj,
      rotulo: ROTULOS[p.tipoAnaliseCdObj],
      valorKgM3: Number(p.valorKgM3),
    }));

  if (pesos.length === 0) return [];

  const todosSilos: SiloOpcao[] = await service.listarSilos();

  const tabelas: TabelaReferencia[] = [];

  for (const tipo of TIPOS_SILO) {
    /* Geometria do tipo: o primeiro silo vigente daquele tipo */
    let geometria: GeometriaSilo | null = null;
    const silos: SiloOpcao[] = [];

    for (const silo of todosSilos) {
      const p = porSilo.get(silo.cdObj);
      if (!p || p.tipoSilo !== tipo) continue;
      silos.push(silo);
      if (!geometria) geometria = p.geometria;
    }

    if (!geometria || silos.length === 0) continue;

    tabelas.push(montarTabelaReferencia(tipo, geometria, silos, pesos));
  }

  return tabelas;
}