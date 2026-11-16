/* prisma/seed-parametros.ts */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "❌ DATABASE_URL não definido. Defina a variável (do banco alvo) antes de rodar o seed de parâmetros.",
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/* ── Geometria comum a todos os tipos (aba BD) ─────────────── */
/* D = 1,9 m · d = 0,25 m · x = (D − d) / 2 = 0,825 m          */
const GEOMETRIA = {
  diametro: 1.9,
  areaBaseMaior: 2.835284975,
  areaBaseMenor: 0.04908734375,
  alturaTronco: 0.825,
};

/* ── Alturas úteis por tipo (aba BD, linha 4) ──────────────── */
const ALTURAS: Record<string, number> = {
  I: 3.97,
  II: 4.02,
  III: 4.65,
  IV: 4.68,
  V: 5.08,
  VI: 5.1,
  VII: 5.15,
};

/* ── Silos por tipo (abas Silos I a VII) ───────────────────── */
const SILOS_POR_TIPO: Record<string, string[]> = {
  I: ["09", "10", "27", "28", "45", "46"],
  II: ["58"],
  III: ["08", "11", "26", "29", "44", "47"],
  IV: ["01", "18", "19", "36", "37", "54", "57"],
  V: ["02", "03", "16", "17", "20", "21", "34", "35", "38", "39", "52", "53"],
  VI: [
    "04", "05", "06", "07", "12", "13", "14", "15",
    "22", "23", "24", "25", "30", "31", "32", "33",
    "40", "41", "42", "43", "48", "49", "50", "51", "56",
  ],
  VII: ["55"],
};

/* ── CdObj → número do silo (TbObj, filhos de CdObjMae 53115) ─ */
const CDOBJ_POR_SILO: Record<string, number> = {
  "01": 53116, "02": 53117, "03": 53118, "04": 53119, "05": 53120,
  "06": 53121, "07": 53122, "08": 53123, "09": 53124, "10": 53125,
  "11": 53332, "12": 53333, "13": 53334, "14": 53335, "15": 53336,
  "16": 53337, "17": 53338, "18": 53439, "19": 53440, "20": 53441,
  "21": 53442, "22": 53443, "23": 53444, "24": 53445, "25": 53446,
  "26": 53447, "27": 53448, "28": 53449, "29": 53450, "30": 53451,
  "31": 53452, "32": 53453, "33": 53454, "34": 53455, "35": 53456,
  "36": 53457, "37": 53458, "38": 53459, "39": 53460, "40": 53461,
  "41": 53462, "42": 53463, "43": 53464, "44": 53465, "45": 53466,
  "46": 53467, "47": 53468, "48": 53469, "49": 53470, "50": 53471,
  "51": 53472, "52": 53473, "53": 53474, "54": 53475, "55": 53476,
  "56": 53477, "57": 53478, "58": 53479,
};

/* ── Pesos específicos de repouso por CdObj de tipo ────────── */
const PESOS: Record<number, number> = {
  52913: 651.68,
  52914: 632.96,
  52916: 624.96,
  52917: 610.88,
};

const SAFRA = "2026/2027";
const INICIO = new Date("2026-01-01T00:00:00Z");

async function seedParametroSilo(): Promise<number> {
  let criados = 0;

  for (const [tipo, silos] of Object.entries(SILOS_POR_TIPO)) {
    const alturaUtil = ALTURAS[tipo];
    if (alturaUtil === undefined) {
      throw new Error(`Tipo de silo inválido: ${tipo}`);
    }

    for (const numero of silos) {
      const siloCdObj = CDOBJ_POR_SILO[numero];
      if (siloCdObj === undefined) {
        throw new Error(`Silo ${numero} sem CdObj mapeado`);
      }

      /* Idempotência: só cria se não houver geometria vigente */
      const vigente = await prisma.parametroSilo.findFirst({
        where: { siloCdObj, vigenciaFim: null },
        select: { id: true },
      });
      if (vigente) continue;

      await prisma.parametroSilo.create({
        data: {
          siloCdObj,
          tipoSilo: tipo as never,
          vigenciaInicio: INICIO,
          alturaUtil,
          ...GEOMETRIA,
          motivo: "Carga inicial da memória de cálculo",
          criadoPor: "seed",
        },
      });
      criados++;
    }
  }

  return criados;
}

async function seedPesoEspecifico(): Promise<number> {
  let criados = 0;

  for (const [cdObj, valorKgM3] of Object.entries(PESOS)) {
    const tipoAnaliseCdObj = Number(cdObj);

    const vigente = await prisma.pesoEspecifico.findFirst({
      where: { tipoAnaliseCdObj, vigenciaFim: null },
      select: { id: true },
    });
    if (vigente) continue;

    await prisma.pesoEspecifico.create({
      data: {
        tipoAnaliseCdObj,
        safra: SAFRA,
        vigenciaInicio: INICIO,
        valorKgM3,
        observacao: "Valor de repouso da planilha de memória de cálculo",
      },
    });
    criados++;
  }

  return criados;
}

async function main() {
  console.log("Carregando parâmetros de cálculo de silo...");

  const silos = await seedParametroSilo();
  const pesos = await seedPesoEspecifico();

  const totalSilos = await prisma.parametroSilo.count();
  const totalPesos = await prisma.pesoEspecifico.count();

  console.log(`ParametroSilo: ${silos} criados (total ${totalSilos}).`);
  console.log(`PesoEspecifico: ${pesos} criados (total ${totalPesos}).`);
}

main()
  .catch((e) => {
    console.error("Falha no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());