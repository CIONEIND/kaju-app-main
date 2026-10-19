// src/app/(producao)/producao/mock-analises.ts
import type { Analise, TipoFormulario } from "@/app/(protected)/(producao)/producao/types";



// Fase 2: esta lista passa a ser lida da tabela TbTipoAnalise
export const TIPOS_FORMULARIO: TipoFormulario[] = [
  { codigo: "F3PGI6", nome: "Análise F3PGI6", processo: "CAST" },
  { codigo: "F6PGI6", nome: "Análise F6PGI6", processo: "CAST" },
  { codigo: "LCC", nome: "Resultados Diários de LCC", processo: "AMEND" },
  { codigo: "PUREZA", nome: "Análise de Pureza dos Classificadores", processo: "AMEND" },
];

const OPERADORES = ["Raimundo Torquato", "Maria Silva", "João Souza"];

// Gera ~28 registros distribuídos nos últimos 15 dias — só para demonstrar filtros + paginação
function gerarMocks(): Analise[] {
  const lista: Analise[] = [];
  const agora = new Date();
  let seq = 141;

  for (let i = 0; i < 28; i++) {
    const tipo = TIPOS_FORMULARIO[i % TIPOS_FORMULARIO.length];
    const data = new Date(agora);
    data.setDate(data.getDate() - Math.floor(i / 2)); // 2 análises por dia
    data.setHours(8 + (i % 8), (i * 13) % 60, 0, 0);
    seq += 1;

    lista.push({
      id: String(i + 1),
      tipoCodigo: tipo.codigo,
      tipoNome: tipo.nome,
      processo: tipo.processo,
      lote: `L${String(data.getFullYear()).slice(2)}${String(data.getMonth() + 1).padStart(2, "0")}-${String(seq).padStart(4, "0")}`,
      dataHora: data.toISOString(),
      operador: OPERADORES[i % OPERADORES.length],
      status: i % 5 === 0 ? "RASCUNHO" : "CONCLUIDA",
    });
  }
  return lista;
}

export const ANALISES_MOCK: Analise[] = gerarMocks();