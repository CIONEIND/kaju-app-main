// src/app/(producao)/producao/mock-analises.ts
import type { Analise, TipoFormulario } from "../../../app/(protected)/(producao)/producao/types";

// Fase 2: esta lista passa a ser lida da tabela TbTipoAnalise
export const TIPOS_FORMULARIO: TipoFormulario[] = [
  { codigo: "F3PGI6", nome: "Análise F3PGI6", processo: "CAST" },
  { codigo: "F6PGI6", nome: "Análise F6PGI6", processo: "CAST" },
  { codigo: "LCC", nome: "Resultados Diários de LCC", processo: "AMEND" },
  { codigo: "PUREZA", nome: "Análise de Pureza dos Classificadores", processo: "AMEND" },
];

export const ANALISES_MOCK: Analise[] = [
  { id: "1", tipoCodigo: "F3PGI6", tipoNome: "Análise F3PGI6", processo: "CAST", lote: "L2610-0142", dataHora: "2026-10-13T08:12:00", operador: "Raimundo Torquato", status: "CONCLUIDA" },
  { id: "2", tipoCodigo: "F6PGI6", tipoNome: "Análise F6PGI6", processo: "CAST", lote: "L2610-0143", dataHora: "2026-10-13T09:45:00", operador: "Maria Silva", status: "CONCLUIDA" },
  { id: "3", tipoCodigo: "LCC", tipoNome: "Resultados Diários de LCC", processo: "AMEND", lote: "L2610-0144", dataHora: "2026-10-12T14:30:00", operador: "João Souza", status: "RASCUNHO" },
  { id: "4", tipoCodigo: "PUREZA", tipoNome: "Análise de Pureza dos Classificadores", processo: "AMEND", lote: "L2610-0145", dataHora: "2026-10-12T16:05:00", operador: "Maria Silva", status: "CONCLUIDA" },
  { id: "5", tipoCodigo: "F3PGI6", tipoNome: "Análise F3PGI6", processo: "CAST", lote: "L2609-0138", dataHora: "2026-10-11T07:58:00", operador: "João Souza", status: "CONCLUIDA" },
  { id: "6", tipoCodigo: "LCC", tipoNome: "Resultados Diários de LCC", processo: "AMEND", lote: "L2609-0139", dataHora: "2026-10-10T13:20:00", operador: "Raimundo Torquato", status: "CONCLUIDA" },
  { id: "7", tipoCodigo: "F6PGI6", tipoNome: "Análise F6PGI6", processo: "CAST", lote: "L2609-0140", dataHora: "2026-10-10T10:11:00", operador: "Maria Silva", status: "CONCLUIDA" },
  { id: "8", tipoCodigo: "PUREZA", tipoNome: "Análise de Pureza dos Classificadores", processo: "AMEND", lote: "L2609-0141", dataHora: "2026-10-09T15:47:00", operador: "João Souza", status: "RASCUNHO" },
];