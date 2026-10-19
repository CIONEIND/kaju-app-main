// src/app/(producao)/producao/analises/[tipo]/novo/actions.ts
"use server";

import { getUsuarioAtual } from "@/lib/auth/auth"; // ADAPTAR: sessão existente do app

export interface DadosF3PGI6 {
  data: string;       // "YYYY-MM-DD"
  hora: string;       // "HH:mm"
  responsavelCdUsr: string; // CdUsr do TopManager (de-para)
  loteId: string;
  tipoCdObj: string;
  amendoa: { t1: number | null; t2: number | null; t3: number | null };
  casca: { t1: number | null; t2: number | null; t3: number | null };
}

export async function salvarAnaliseF3PGI6(dados: DadosF3PGI6): Promise<{ ok: boolean; erro?: string }> {
  const usuario = await getUsuarioAtual();

  if (!usuario) return { ok: false, erro: "Sessão expirada. Faça login novamente." };

  // De-para Kaju ↔ TopManager: sem vínculo, não grava
  if (!usuario.cdUsrTopManager) {
    return { ok: false, erro: "Usuário sem vínculo com o TopManager — solicite ao administrador." };
  }

  // FASE 3: gravar na CIONE_F3PGI6 do TopManager (TopTESTE no dev)
  // INSERT INTO CIONE_F3PGI6 (DataHora, Responsavel, Lote, Tipo, T1Amendoa, T2Amendoa, T3Amendoa, T1Casca, T2Casca, T3Casca)
  // — responsavel = usuario.cdUsrTopManager
  // — atualizar o índice local no Postgres para a lista do painel
  console.log("[F3PGI6] Gravação no TopManager (Fase 3):", { ...dados, responsavelCdUsr: usuario.cdUsrTopManager });

  return { ok: true };
}