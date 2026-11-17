"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF6PGI6Service from "@/lib/top-manager/service/cione-f6pgi6/cione-f6pgi6.service";

const service = new CioneF6PGI6Service();

export interface SalvarAnaliseF6PGI6Input {
  id?: number;
  status?: "rascunho" | "concluida";
  responsavelCdUsr: number;
  loteId: number;
  siloId: number;
  tipoId: number;
  modoMedicao?: "vazio" | "produto";

  /* Leitura inicial */
  dataInicial: string;
  horaInicial?: string;
  vazioInicial?: number | null;

  /* Leitura final */
  dataFinal?: string;
  horaFinal?: string;
  vazioFinal?: number | null;
}

export type SalvarAnaliseF6PGI6Result =
  | {
      ok: true;
      id: number;
      proximaAnaliseId: number | null;
      proximaCompetencia: string | null;
    }
  | { ok: false; erro: string };

export async function salvarAnaliseF6PGI6(
  input: SalvarAnaliseF6PGI6Input,
): Promise<SalvarAnaliseF6PGI6Result> {
  try {
    const usuario = await getUsuarioAtual();
    if (!usuario) return { ok: false, erro: "Sessão expirada." };
    await requirePermission(PERMISSIONS.ANALISES_MANAGE);

    const dto = {
      status: input.status ?? "concluida",
      responsavelCdUsr: input.responsavelCdUsr,
      loteId: input.loteId,
      siloId: input.siloId,
      tipoId: input.tipoId,
      modoMedicao: input.modoMedicao ?? "vazio",
      dataInicial: input.dataInicial,
      horaInicial: input.horaInicial,
      vazioInicial: input.vazioInicial ?? null,
      dataFinal: input.dataFinal,
      horaFinal: input.horaFinal,
      vazioFinal: input.vazioFinal ?? null,
    };

    const resultado = input.id
      ? await service.atualizar(input.id, dto)
      : await service.criar(dto);

    return {
      ok: true,
      id: resultado.id,
      proximaAnaliseId: resultado.proximaAnaliseId,
      proximaCompetencia: resultado.proximaCompetencia,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar a análise.";
    return { ok: false, erro: msg };
  }
}