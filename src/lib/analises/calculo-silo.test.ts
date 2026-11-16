import { describe, expect, it } from "vitest";
import {
  calcularConsumo,
  calcularLeitura,
  calcularVolumeTronco,
  ErroCalculoSilo,
  type GeometriaSilo,
} from "./calculo-silo";

/* Geometria real da planilha (aba BD) */
const GEOMETRIA: GeometriaSilo = {
  alturaUtil: 3.97,
  diametro: 1.9,
  areaBaseMaior: 2.835284975,
  areaBaseMenor: 0.04908734375,
  alturaTronco: 1,        // ← era 0.825
};

const PESO_25 = 624.96;

describe("calcularVolumeTronco", () => {
  it("produz 1,08581204375 m³ com a geometria da planilha", () => {
    expect(calcularVolumeTronco(GEOMETRIA)).toBeCloseTo(1.08581204375, 9);
  });
});

describe("calcularLeitura — tipo I", () => {
  it("vazio 0,00 → silo cheio", () => {
    const r = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 0,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    expect(r.alturaGrao).toBeCloseTo(3.97, 6);
    expect(r.volumeCilindro).toBeCloseTo(11.25608135075, 6);
    expect(r.volumeTronco).toBeCloseTo(1.08581204375, 6);
    expect(r.volumeTotal).toBeCloseTo(12.3418933945, 6);
    expect(r.pesoKg).toBeCloseTo(7713.18969582672, 4);
    expect(r.lotacao).toBeCloseTo(100, 6);
  });

  it("vazio 0,40 → valores da planilha", () => {
    const r = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 0.4,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    expect(r.volumeTotal).toBeCloseTo(11.2077794045, 6);
    expect(r.pesoKg).toBeCloseTo(7004.413816636321, 4);
  });

  it("vazio 0,50 → 6.827,22 kg", () => {
    const r = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 0.5,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    expect(r.pesoKg).toBeCloseTo(6827.21984683872, 4);
  });

  it("vazio 2,00 → 4.169,31 kg", () => {
    const r = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 2,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    expect(r.pesoKg).toBeCloseTo(4169.310299874717, 4);
  });

  it("vazio 3,00 → 2.397,37 kg", () => {
    const r = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 3,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    expect(r.pesoKg).toBeCloseTo(2397.370601898716, 4);
  });
});

describe("modo de medição", () => {
  it("medir produto 3,57 m equivale a vazio 0,40 m", () => {
    const porVazio = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 0.4,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    const porProduto = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 3.57,
      modo: "produto",
      pesoEspecifico: PESO_25,
    });
    expect(porProduto.volumeTotal).toBeCloseTo(porVazio.volumeTotal, 9);
    expect(porProduto.pesoKg).toBeCloseTo(porVazio.pesoKg, 6);
  });
});

describe("validações", () => {
  it("bloqueia nível acima da área útil", () => {
    expect(() =>
      calcularLeitura({
        geometria: GEOMETRIA,
        valorMedido: 4.2,
        modo: "vazio",
        pesoEspecifico: PESO_25,
      }),
    ).toThrow(ErroCalculoSilo);
  });

  it("bloqueia terceira casa decimal", () => {
    expect(() =>
      calcularLeitura({
        geometria: GEOMETRIA,
        valorMedido: 0.405,
        modo: "vazio",
        pesoEspecifico: PESO_25,
      }),
    ).toThrow(/2 casas decimais/);
  });

  it("bloqueia vazio negativo", () => {
    expect(() =>
      calcularLeitura({
        geometria: GEOMETRIA,
        valorMedido: -0.1,
        modo: "vazio",
        pesoEspecifico: PESO_25,
      }),
    ).toThrow(/negativo/);
  });
});

describe("calcularConsumo", () => {
  it("cenário da supervisão: 0,40 → 2,10", () => {
    const inicial = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 0.4,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    const final = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 2.1,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    const consumo = calcularConsumo(inicial, final, PESO_25);
    expect(consumo.volumeConsumido).toBeGreaterThan(0);
    expect(consumo.pesoConsumido).toBeCloseTo(
      consumo.volumeConsumido * PESO_25,
      6,
    );
  });

  it("bloqueia leitura final maior que a inicial", () => {
    const inicial = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 2.1,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    const final = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 0.4,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    expect(() => calcularConsumo(inicial, final, PESO_25)).toThrow(
      /volume maior que a inicial/,
    );
  });
});

describe("geometria por tipo", () => {
  it("mesma geometria, alturas diferentes produzem volumes diferentes", () => {
    const tipoI = calcularLeitura({
      geometria: GEOMETRIA,
      valorMedido: 0,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    const tipoVII = calcularLeitura({
      geometria: { ...GEOMETRIA, alturaUtil: 5.15 },
      valorMedido: 0,
      modo: "vazio",
      pesoEspecifico: PESO_25,
    });
    expect(tipoVII.volumeTotal).toBeGreaterThan(tipoI.volumeTotal);
  });
});