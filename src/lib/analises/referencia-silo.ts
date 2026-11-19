import type { GeometriaSilo } from "./calculo-silo";
import { calcularLeitura } from "./calculo-silo";

/** Um peso específico disponível para coluna da tabela */
export interface PesoColuna {
  /** CdObj do tipo de análise (52913, 52914...) */
  tipoAnaliseCdObj: number;
  /** Rótulo curto da coluna: "21", "23", "25", "28" */
  rotulo: string;
  /** Valor em kg/m³ */
  valorKgM3: number;
}

export interface LinhaReferencia {
  /** Nível de vazio em metros */
  vazio: number;
  /** Volume do cilindro, m³ */
  volumeCilindro: number;
  /** Volume do tronco de cone, m³ */
  volumeTronco: number;
  /** Volume total, m³ */
  volumeTotal: number;
  /** Peso por tipo de análise, na mesma ordem de `pesos` */
  pesos: number[];
}

export interface TabelaReferencia {
  tipoSilo: string;
  silos: { cdObj: number; nome: string }[];
  alturaUtil: number;
  diametro: number;
  pesos: PesoColuna[];
  linhas: LinhaReferencia[];
}

/** Arredonda para a escala de exibição */
function r(valor: number, casas: number): number {
  const f = 10 ** casas;
  return Math.round(valor * f) / f;
}

/**
 * Monta a tabela de referência de um tipo de silo.
 *
 * O passo é de 10 cm, como na planilha. A última linha é sempre
 * a altura útil, para o operador ver o silo completamente vazio.
 */
export function montarTabelaReferencia(
  tipoSilo: string,
  geometria: GeometriaSilo,
  silos: { cdObj: number; nome: string }[],
  pesos: PesoColuna[],
): TabelaReferencia {
  const linhas: LinhaReferencia[] = [];

  /* Níveis de 0,00 até a altura útil, de 10 em 10 cm */
  const total = Math.floor(geometria.alturaUtil * 10);
  const niveis: number[] = [];

  for (let i = 0; i <= total; i++) {
    const vazio = r(i / 10, 2);
    if (vazio >= geometria.alturaUtil) break;
    niveis.push(vazio);
  }

  /* A última linha é sempre a altura útil exata — silo completamente vazio */
  niveis.push(r(geometria.alturaUtil, 2));

  for (const vazio of niveis) {
    let leitura;
    try {
      leitura = calcularLeitura({
        geometria,
        valorMedido: vazio,
        modo: "vazio",
        pesoEspecifico: pesos[0]?.valorKgM3 ?? 0,
      });
    } catch {
      /* Nível fora da faixa — registra a linha zerada em vez de quebrar a tabela */
      linhas.push({
        vazio,
        volumeCilindro: 0,
        volumeTronco: 0,
        volumeTotal: 0,
        pesos: pesos.map(() => 0),
      });
      continue;
    }

    linhas.push({
      vazio,
      volumeCilindro: r(leitura.volumeCilindro, 2),
      volumeTronco: r(leitura.volumeTronco, 2),
      volumeTotal: r(leitura.volumeTotal, 2),
      pesos: pesos.map((p) => r(leitura.volumeTotal * p.valorKgM3, 0)),
    });
  }

  return {
    tipoSilo,
    silos,
    alturaUtil: geometria.alturaUtil,
    diametro: geometria.diametro,
    pesos,
    linhas,
  };
}