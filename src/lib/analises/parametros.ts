/* ============================================================
   Consulta de parâmetros vigentes (ParametroSilo e PesoEspecifico)
   Regra: vigenciaInicio <= data E (vigenciaFim IS NULL OU > data)
   ============================================================ */

import { prisma } from "@/lib/prisma";
import type { GeometriaSilo } from "./calculo-silo";

export interface PesoEspecificoVigente {
  valorKgM3: number;
  safra: string;
}

function formatarData(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/**
 * Geometria do silo vigente na data informada.
 */
export async function buscarParametroSilo(
  siloCdObj: number,
  data: Date,
): Promise<GeometriaSilo> {
  const registro = await prisma.parametroSilo.findFirst({
    where: {
      siloCdObj,
      vigenciaInicio: { lte: data },
      OR: [{ vigenciaFim: null }, { vigenciaFim: { gt: data } }],
    },
    orderBy: { vigenciaInicio: "desc" },
  });

  if (!registro) {
    throw new Error(
      `Nenhuma geometria vigente para o silo ${siloCdObj} em ${formatarData(data)}.`,
    );
  }

  return {
    alturaUtil: Number(registro.alturaUtil),
    diametro: Number(registro.diametro),
    areaBaseMaior: Number(registro.areaBaseMaior),
    areaBaseMenor: Number(registro.areaBaseMenor),
    alturaTronco: Number(registro.alturaTronco),
  };
}

/**
 * Peso específico de repouso vigente na data informada.
 */
export async function buscarPesoEspecifico(
  tipoAnaliseCdObj: number,
  data: Date,
): Promise<PesoEspecificoVigente> {
  const registro = await prisma.pesoEspecifico.findFirst({
    where: {
      tipoAnaliseCdObj,
      vigenciaInicio: { lte: data },
      OR: [{ vigenciaFim: null }, { vigenciaFim: { gt: data } }],
    },
    orderBy: { vigenciaInicio: "desc" },
  });

  if (!registro) {
    throw new Error(
      `Nenhum peso específico vigente para o tipo ${tipoAnaliseCdObj} em ${formatarData(data)}.`,
    );
  }

  return {
    valorKgM3: Number(registro.valorKgM3),
    safra: registro.safra,
  };
}

/**
 * Resolve os dois parâmetros de uma análise em uma só chamada.
 */
export async function buscarParametrosAnalise(
  siloCdObj: number,
  tipoAnaliseCdObj: number,
  data: Date,
): Promise<{ geometria: GeometriaSilo; peso: PesoEspecificoVigente }> {
  const [geometria, peso] = await Promise.all([
    buscarParametroSilo(siloCdObj, data),
    buscarPesoEspecifico(tipoAnaliseCdObj, data),
  ]);

  return { geometria, peso };
}