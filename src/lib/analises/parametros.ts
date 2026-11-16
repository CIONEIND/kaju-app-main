import { prisma } from "@/lib/prisma";
import type { TipoSilo } from "./calculo-silo";

export interface ParametroSiloVigente {
  alturaUtil: number;
  diametro: number;
  areaBaseMaior: number;
  areaBaseMenor: number;
  alturaTronco: number;
}

export interface PesoEspecificoVigente {
  valorKgM3: number;
  safra: string;
}

/**
 * Geometria do silo vigente na data informada.
 * Regra: vigenciaInicio <= data E (vigenciaFim IS NULL OU vigenciaFim > data)
 */
export async function buscarParametroSilo(
  siloCdObj: number,
  data: Date,
): Promise<ParametroSiloVigente> {
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
      `Nenhuma geometria vigente para o silo ${siloCdObj} em ${data.toISOString().slice(0, 10)}.`,
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
      `Nenhum peso específico vigente para o tipo ${tipoAnaliseCdObj} em ${data.toISOString().slice(0, 10)}.`,
    );
  }

  return {
    valorKgM3: Number(registro.valorKgM3),
    safra: registro.safra,
  };
}

/** Resolve os dois parâmetros de uma vez, para uma análise. */
export async function buscarParametrosAnalise(
  siloCdObj: number,
  tipoAnaliseCdObj: number,
  data: Date,
): Promise<{ silo: ParametroSiloVigente; peso: PesoEspecificoVigente }> {
  const [silo, peso] = await Promise.all([
    buscarParametroSilo(siloCdObj, data),
    buscarPesoEspecifico(tipoAnaliseCdObj, data),
  ]);
  return { silo, peso };
}