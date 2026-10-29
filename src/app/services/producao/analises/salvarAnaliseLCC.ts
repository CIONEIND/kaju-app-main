"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneLCCService from "@/lib/top-manager/service/cione-lcc/cione-lcc.service";

const service = new CioneLCCService();

export interface SalvarAnaliseLCCInput {
  id?: number;
  status?: "rascunho" | "concluida";
  data: string;
  hora?: string;
  responsavelCdUsr: number;
  loteId: number;
  origemId: number;
  viscosidade?: number | null;
  altura?: number | null;
  temperatura?: number | null;
}

export type SalvarAnaliseLCCResult =
  | { ok: true; id: number }
  | { ok: false; erro: string };

export async function salvarAnaliseLCC(
  input: SalvarAnaliseLCCInput,
): Promise<SalvarAnaliseLCCResult> {
  try {
    const usuario = await getUsuarioAtual();
    if (!usuario) return { ok: false, erro: "Sessão expirada." };
    await requirePermission(PERMISSIONS.ANALISES_MANAGE);

    const dto = {
      status: input.status ?? "concluida",
      data: input.data,
      hora: input.hora,
      responsavelCdUsr: input.responsavelCdUsr,
      loteId: input.loteId,
      origemId: input.origemId,
      viscosidade: input.viscosidade ?? null,
      altura: input.altura ?? null,
      temperatura: input.temperatura ?? null,
    };

    if (input.id) {
      await service.atualizar(input.id, dto);
      return { ok: true, id: input.id };
    }
    const id = await service.criar(dto);
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      erro: e instanceof Error ? e.message : "Erro ao salvar a análise.",
    };
  }
}