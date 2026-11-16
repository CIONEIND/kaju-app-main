/* ============================================================
   Motor de cálculo de volume e peso de silos — F6PGI6
   Geometria e peso específico vêm do banco (ParametroSilo e
   PesoEspecifico), não de constantes do código.
   ============================================================ */

const PI = 3.14159;

export type TipoSilo = "I" | "II" | "III" | "IV" | "V" | "VI" | "VII";
export type ModoMedicao = "vazio" | "produto";

export interface GeometriaSilo {
  alturaUtil: number;
  diametro: number;
  areaBaseMaior: number;
  areaBaseMenor: number;
  alturaTronco: number;
}

export interface EntradaCalculo {
  geometria: GeometriaSilo;
  valorMedido: number;
  modo: ModoMedicao;
  pesoEspecifico: number;
}

export interface ResultadoCalculo {
  vazio: number;
  alturaGrao: number;
  volumeCilindro: number;
  volumeTronco: number;
  volumeTotal: number;
  pesoKg: number;
  lotacao: number;
}

export type CodigoErroCalculo =
  | "ACIMA_AREA_UTIL"
  | "NEGATIVO"
  | "CASAS_DECIMAIS";

export class ErroCalculoSilo extends Error {
  constructor(
    message: string,
    public readonly codigo: CodigoErroCalculo,
  ) {
    super(message);
    this.name = "ErroCalculoSilo";
  }
}

/** VTC — tronco de cone completo: (A1 + √(A1·A2) + A2) / 3 × x */
export function calcularVolumeTronco(g: GeometriaSilo): number {
  const raiz = Math.sqrt(g.areaBaseMaior * g.areaBaseMenor);
  return ((g.areaBaseMaior + raiz + g.areaBaseMenor) / 3) * g.alturaTronco;
}

export function arredondar(valor: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

export function validarCasasDecimais(valor: number): void {
  if (Math.round(valor * 100) !== valor * 100) {
    throw new ErroCalculoSilo(
      "O nível deve ter no máximo 2 casas decimais.",
      "CASAS_DECIMAIS",
    );
  }
}

export function calcularVazio(
  geometria: GeometriaSilo,
  valorMedido: number,
  modo: ModoMedicao,
): number {
  const { alturaUtil } = geometria;
  const vazio = modo === "vazio" ? valorMedido : alturaUtil - valorMedido;

  if (!Number.isFinite(vazio)) {
    throw new ErroCalculoSilo("Valor medido inválido.", "NEGATIVO");
  }

  if (vazio < 0) {
    throw new ErroCalculoSilo(
      modo === "vazio"
        ? "O nível de vazio não pode ser negativo."
        : `O nível de produto não pode exceder a altura útil do silo (${alturaUtil} m).`,
      "NEGATIVO",
    );
  }

  if (vazio > alturaUtil) {
    throw new ErroCalculoSilo(
      `O nível não pode ultrapassar a área útil do silo (${alturaUtil} m).`,
      "ACIMA_AREA_UTIL",
    );
  }

  return vazio;
}

export function calcularLeitura(entrada: EntradaCalculo): ResultadoCalculo {
  const { geometria, valorMedido, modo, pesoEspecifico } = entrada;

  validarCasasDecimais(valorMedido);

  const vazio = calcularVazio(geometria, valorMedido, modo);
  const alturaGrao = geometria.alturaUtil - vazio;

  const volumeCilindro =
    ((geometria.diametro * geometria.diametro * PI) / 4) * alturaGrao;
  const volumeTronco = calcularVolumeTronco(geometria);
  const volumeTotal = volumeCilindro + volumeTronco;

  return {
    vazio,
    alturaGrao,
    volumeCilindro,
    volumeTronco,
    volumeTotal,
    pesoKg: volumeTotal * pesoEspecifico,
    lotacao: (alturaGrao / geometria.alturaUtil) * 100,
  };
}

export function calcularConsumo(
  inicial: ResultadoCalculo,
  final: ResultadoCalculo,
  pesoEspecifico: number,
): { volumeConsumido: number; pesoConsumido: number } {
  const volumeConsumido = inicial.volumeTotal - final.volumeTotal;

  if (volumeConsumido < 0) {
    throw new ErroCalculoSilo(
      "A leitura final tem volume maior que a inicial — verifique as medições.",
      "NEGATIVO",
    );
  }

  return {
    volumeConsumido,
    pesoConsumido: volumeConsumido * pesoEspecifico,
  };
}