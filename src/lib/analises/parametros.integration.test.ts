/* ============================================================
   Teste de integração: valida que a geometria gravada no banco
   produz o VTC esperado da planilha.
   Requer banco populado (npm run db:seed:parametros).
   ============================================================ */

import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { calcularVolumeTronco, type GeometriaSilo } from "./calculo-silo";

const VTC_ESPERADO = 1.08581204375;

describe("ParametroSilo — geometria gravada", () => {
  it("tem os 58 silos cadastrados", async () => {
    const total = await prisma.parametroSilo.count({
      where: { vigenciaFim: null },
    });
    expect(total).toBe(58);
  });

  it("cada silo tem exatamente uma geometria vigente", async () => {
    const duplicados = await prisma.parametroSilo.groupBy({
      by: ["siloCdObj"],
      where: { vigenciaFim: null },
      having: { siloCdObj: { _count: { gt: 1 } } },
    });
    expect(duplicados).toHaveLength(0);
  });

  it("o VTC calculado a partir do banco bate com a planilha", async () => {
    const registro = await prisma.parametroSilo.findFirst({
      where: { vigenciaFim: null },
    });
    expect(registro).not.toBeNull();

    const geometria: GeometriaSilo = {
      alturaUtil: Number(registro!.alturaUtil),
      diametro: Number(registro!.diametro),
      areaBaseMaior: Number(registro!.areaBaseMaior),
      areaBaseMenor: Number(registro!.areaBaseMenor),
      alturaTronco: Number(registro!.alturaTronco),
    };

    expect(calcularVolumeTronco(geometria)).toBeCloseTo(VTC_ESPERADO, 9);
  });

  it("as alturas por tipo batem com a planilha", async () => {
    const esperado: Record<string, number> = {
      I: 3.97, II: 4.02, III: 4.65, IV: 4.68,
      V: 5.08, VI: 5.1, VII: 5.15,
    };

    for (const [tipo, altura] of Object.entries(esperado)) {
      const registro = await prisma.parametroSilo.findFirst({
        where: { tipoSilo: tipo as never, vigenciaFim: null },
      });
      expect(registro, `tipo ${tipo} sem registro`).not.toBeNull();
      expect(Number(registro!.alturaUtil)).toBeCloseTo(altura, 2);
    }
  });

  it("a distribuição de silos por tipo bate com a planilha", async () => {
    const esperado: Record<string, number> = {
      I: 6, II: 1, III: 6, IV: 7, V: 12, VI: 25, VII: 1,
    };

    for (const [tipo, qtd] of Object.entries(esperado)) {
      const total = await prisma.parametroSilo.count({
        where: { tipoSilo: tipo as never, vigenciaFim: null },
      });
      expect(total, `tipo ${tipo}`).toBe(qtd);
    }
  });
});

describe("PesoEspecifico — valores gravados", () => {
  it("tem os quatro pesos da planilha", async () => {
    const registros = await prisma.pesoEspecifico.findMany({
      where: { vigenciaFim: null },
    });
    expect(registros).toHaveLength(4);

    const mapa = Object.fromEntries(
      registros.map((r) => [r.tipoAnaliseCdObj, Number(r.valorKgM3)]),
    );

    expect(mapa[52913]).toBeCloseTo(651.68, 2);
    expect(mapa[52914]).toBeCloseTo(632.96, 2);
    expect(mapa[52916]).toBeCloseTo(624.96, 2);
    expect(mapa[52917]).toBeCloseTo(610.88, 2);
  });
});