/* ============================================================
   Motor de cálculo de volume e peso de silos — F6PGI6

   Geometria e peso específico vêm do banco (ParametroSilo e
   PesoEspecifico). As constantes abaixo reproduzem exatamente
   a memória de cálculo da planilha de referência:

     π  = 3,14159
     D  = 1,90 m   (diâmetro do cilindro — fixo para todos os tipos)
     d  = 0,25 m   (diâmetro da ponta do cone — fixo)
     b  = 1,00 m   (altura do tronco de cone — fixo)
     a  = altura do cilindro (variável por tipo de silo)

   A altura útil do silo é a + b. O produto enche primeiro o
   cilindro (de baixo para cima) e depois o cone. Por isso o
   volume do cone só começa a cair quando o vazio ultrapassa a
   altura do cilindro.
   ============================================================ */

/** π usado na memória de cálculo da planilha (não é Math.PI) */
const PI = 3.14159;

export type TipoSilo = "I" | "II" | "III" | "IV" | "V" | "VI" | "VII";
export type ModoMedicao = "vazio" | "produto";

export interface GeometriaSilo {
  /** Altura útil total = altura do cilindro (a) + altura do tronco (b) */
  alturaUtil: number;
  /** Diâmetro do cilindro (D) — 1,90 m na planilha */
  diametro: number;
  /** Área da base maior do cone = π·D²/4 */
  areaBaseMaior: number;
  /** Área da base menor do cone = π·d²/4 */
  areaBaseMenor: number;
  /** Altura do tronco de cone (b) — 1,00 m na planilha */
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

/** Altura do cilindro (a) = altura útil − altura do tronco */
export function alturaCilindro(g: GeometriaSilo): number {
  return g.alturaUtil - g.alturaTronco;
}

/**
 * VTC — volume do tronco de cone efetivamente ocupado.
 *
 * O cone está CHEIO enquanto o vazio for menor ou igual à altura
 * do cilindro. A partir daí, o produto restante dentro do cone
 * diminui e o volume cai proporcionalmente, até zerar quando o
 * vazio atinge a altura útil total.
 */
export function calcularVolumeTronco(
  g: GeometriaSilo,
  vazio: number,
): number {
  const aCilindro = alturaCilindro(g);

  /* Cone cheio: o produto ainda cobre o tronco inteiro */
  if (vazio <= aCilindro) {
    const raiz = Math.sqrt(g.areaBaseMaior * g.areaBaseMenor);
    return ((g.areaBaseMaior + raiz + g.areaBaseMenor) / 3) * g.alturaTronco;
  }

  /* Altura de produto que ainda resta dentro do cone */

  const alturaProdutoNoTronco = Math.max(
    0,
    Math.min(g.alturaTronco, g.alturaUtil - vazio),
  );

  if (alturaProdutoNoTronco <= 0) return 0;

  /* Cone parcialmente cheio: tronco de cone truncado pela altura ocupada */
  const razao = alturaProdutoNoTronco / g.alturaTronco;

  const raioMaior = Math.sqrt(g.areaBaseMaior / PI);
  const raioMenor = Math.sqrt(g.areaBaseMenor / PI);
  const raioTopo = raioMaior + (raioMenor - raioMaior) * razao;
  const areaTopo = PI * raioTopo * raioTopo;

  const raiz = Math.sqrt(g.areaBaseMaior * areaTopo);
  return ((g.areaBaseMaior + raiz + areaTopo) / 3) * alturaProdutoNoTronco;
}

export function arredondar(valor: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

export function validarCasasDecimais(valor: number): void {
  const escalado = valor * 100;
  if (Math.abs(escalado - Math.round(escalado)) > 1e-9) {
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

  /* VC: a planilha desconta o vazio direto da altura do cilindro */
  const aCilindro = alturaCilindro(geometria); // alturaUtil - alturaTronco
  const alturaCilindroOcupada = Math.max(0, aCilindro - vazio);
  const volumeCilindro =
    ((geometria.diametro * geometria.diametro * PI) / 4) * alturaCilindroOcupada;

  /* VTC: cone cheio enquanto o vazio não ultrapassa a altura do cilindro */
  const volumeTronco = calcularVolumeTronco(geometria, vazio);

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