-- CreateEnum
CREATE TYPE "TipoSilo" AS ENUM ('I', 'II', 'III', 'IV', 'V', 'VI', 'VII');

-- CreateTable
CREATE TABLE "ParametroSilo" (
    "id" TEXT NOT NULL,
    "siloCdObj" INTEGER NOT NULL,
    "tipoSilo" "TipoSilo" NOT NULL,
    "vigenciaInicio" TIMESTAMP(3) NOT NULL,
    "vigenciaFim" TIMESTAMP(3),
    "alturaUtil" DECIMAL(5,2) NOT NULL,
    "diametro" DECIMAL(5,3) NOT NULL,
    "areaBaseMaior" DECIMAL(12,9) NOT NULL,
    "areaBaseMenor" DECIMAL(12,11) NOT NULL,
    "alturaTronco" DECIMAL(5,3) NOT NULL,
    "motivo" TEXT,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParametroSilo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PesoEspecifico" (
    "id" TEXT NOT NULL,
    "tipoAnaliseCdObj" INTEGER NOT NULL,
    "safra" TEXT NOT NULL,
    "vigenciaInicio" TIMESTAMP(3) NOT NULL,
    "vigenciaFim" TIMESTAMP(3),
    "valorKgM3" DECIMAL(8,2) NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PesoEspecifico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParametroSilo_siloCdObj_vigenciaInicio_idx" ON "ParametroSilo"("siloCdObj", "vigenciaInicio");

-- CreateIndex
CREATE INDEX "ParametroSilo_siloCdObj_vigenciaFim_idx" ON "ParametroSilo"("siloCdObj", "vigenciaFim");

-- CreateIndex
CREATE INDEX "PesoEspecifico_tipoAnaliseCdObj_vigenciaInicio_idx" ON "PesoEspecifico"("tipoAnaliseCdObj", "vigenciaInicio");

-- CreateIndex
CREATE INDEX "PesoEspecifico_tipoAnaliseCdObj_vigenciaFim_idx" ON "PesoEspecifico"("tipoAnaliseCdObj", "vigenciaFim");

-- Garante no máximo uma geometria vigente por silo
CREATE UNIQUE INDEX "ParametroSilo_vigente_unico"
  ON "ParametroSilo" ("siloCdObj")
  WHERE "vigenciaFim" IS NULL;

-- Garante no máximo um peso específico vigente por tipo de análise
CREATE UNIQUE INDEX "PesoEspecifico_vigente_unico"
  ON "PesoEspecifico" ("tipoAnaliseCdObj")
  WHERE "vigenciaFim" IS NULL;