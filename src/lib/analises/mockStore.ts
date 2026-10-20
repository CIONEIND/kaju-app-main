// Store em memória para testes de ponta a ponta (Fase 2).
// AVISO: os dados se perdem quando o servidor reinicia (dev recompila).
// Fase 3: substituir por gravação real no ERP.

export type ResultadoAnalise = "aprovado" | "reprovado" | "pendente";

export interface AnaliseMock {
  id: string;
  tipo: string; // "F3PGI6"
  lote: string;
  tipoAnalise: string;
  dataAnalise: string;
  horaAnalise: string | null;
  resultado: ResultadoAnalise;
  observacoes: string | null;
  responsavelCdUsr: number;
  responsavelNome: string;
  createdAt: string;
  updatedAt: string;
}

export interface NovaAnaliseMock {
  tipo: string;
  lote: string;
  tipoAnalise: string;
  dataAnalise: string;
  horaAnalise?: string;
  resultado: ResultadoAnalise;
  observacoes?: string;
  responsavelCdUsr: number;
  responsavelNome: string;
}

export const LOTES_MOCK = [
  { valor: "1024", rotulo: "Lote Semana 41 — 1024" },
  { valor: "1025", rotulo: "Lote Semana 41 — 1025" },
  { valor: "1018", rotulo: "Lote Semana 40 — 1018" },
  { valor: "1012", rotulo: "Lote Semana 39 — 1012" },
];

export const TIPOS_MOCK = [
  { valor: "12", rotulo: "Amostra Padrão — 12" },
  { valor: "15", rotulo: "Contratipo — 15" },
  { valor: "18", rotulo: "Amostra Cliente — 18" },
];

// ─── Estado em memória (seed para que a listagem mostre algo) ────────────────
const analises: AnaliseMock[] = [
  {
    id: "a-1001",
    tipo: "F3PGI6",
    lote: "1024",
    tipoAnalise: "12",
    dataAnalise: "2026-10-19",
    horaAnalise: "09:30",
    resultado: "aprovado",
    observacoes: "Lote Semana 41 — dentro de especificação.",
    responsavelCdUsr: 12,
    responsavelNome: "Maria Silva",
    createdAt: "2026-10-19T09:30:00.000Z",
    updatedAt: "2026-10-19T09:30:00.000Z",
  },
  {
    id: "a-1002",
    tipo: "F3PGI6",
    lote: "1025",
    tipoAnalise: "15",
    dataAnalise: "2026-10-18",
    horaAnalise: "14:05",
    resultado: "pendente",
    observacoes: null,
    responsavelCdUsr: 15,
    responsavelNome: "João Souza",
    createdAt: "2026-10-18T14:05:00.000Z",
    updatedAt: "2026-10-18T14:05:00.000Z",
  },
];

let contador = 1003;

function novoId(): string {
  return `a-${contador++}`;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────
export function listarAnalisesMock(): AnaliseMock[] {
  return [...analises].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function buscarAnaliseMock(id: string): AnaliseMock | null {
  return analises.find((a) => a.id === id) ?? null;
}

export function criarAnaliseMock(dados: NovaAnaliseMock): AnaliseMock {
  const agora = new Date().toISOString();
  const analise: AnaliseMock = {
    id: novoId(),
    tipo: dados.tipo,
    lote: dados.lote,
    tipoAnalise: dados.tipoAnalise,
    dataAnalise: dados.dataAnalise,
    horaAnalise: dados.horaAnalise ?? null,
    resultado: dados.resultado,
    observacoes: dados.observacoes ?? null,
    responsavelCdUsr: dados.responsavelCdUsr,
    responsavelNome: dados.responsavelNome,
    createdAt: agora,
    updatedAt: agora,
  };
  analises.push(analise);
  return analise;
}

export function atualizarAnaliseMock(
  id: string,
  dados: Omit<NovaAnaliseMock, "tipo" | "responsavelCdUsr" | "responsavelNome">,
): AnaliseMock | null {
  const analise = buscarAnaliseMock(id);
  if (!analise) return null;
  analise.lote = dados.lote;
  analise.tipoAnalise = dados.tipoAnalise;
  analise.dataAnalise = dados.dataAnalise;
  analise.horaAnalise = dados.horaAnalise ?? null;
  analise.resultado = dados.resultado;
  analise.observacoes = dados.observacoes ?? null;
  analise.updatedAt = new Date().toISOString();
  return analise;
}