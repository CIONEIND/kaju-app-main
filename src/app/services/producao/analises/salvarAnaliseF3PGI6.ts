"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import CioneF3PGI6Service from "@/lib/top-manager/service/cione-f3pgi6/cione-f3pgi6.service";

const service = new CioneF3PGI6Service();

export interface SalvarAnaliseF3PGI6Input {
  /** Presente = edição; ausente = criação */
  id?: number;
  status?: "rascunho" | "concluida";
  data: string;
  hora?: string;
  loteId: number;
  tipoId: number;
  t1Amendoa?: number | null;
  t2Amendoa?: number | null;
  t3Amendoa?: number | null;
  t1Casca?: number | null;
  t2Casca?: number | null;
  t3Casca?: number | null;
}

export type SalvarAnaliseF3PGI6Resultado =
  | { ok: true; id: number }
  | { ok: false; erro: string };

export async function salvarAnaliseF3PGI6(
  input: SalvarAnaliseF3PGI6Input,
): Promise<SalvarAnaliseF3PGI6Resultado> {
  try {
    await requirePermission(PERMISSIONS.ANALISES_MANAGE);
    const usuario = await getUsuarioAtual();
    if (!usuario) return { ok: false, erro: "Sessão expirada. Faça login novamente." };
    if (usuario.cdUsrTopManager === null) {
      return {
        ok: false,
        erro: "Usuário sem vínculo com o TopManager. Peça ao administrador.",
      };
    }
    if (!input.loteId) return { ok: false, erro: "Selecione o lote." };
    if (!input.tipoId) return { ok: false, erro: "Selecione o tipo de análise." };
    if (!input.data) return { ok: false, erro: "Informe a data." };

    const dto = {
      status: input.status ?? "concluida",
      data: input.data,
      hora: input.hora || undefined,
      responsavelCdUsr: usuario.cdUsrTopManager,
      loteId: input.loteId,
      tipoId: input.tipoId,
      t1Amendoa: input.t1Amendoa ?? null,
      t2Amendoa: input.t2Amendoa ?? null,
      t3Amendoa: input.t3Amendoa ?? null,
      t1Casca: input.t1Casca ?? null,
      t2Casca: input.t2Casca ?? null,
      t3Casca: input.t3Casca ?? null,
    };

    if (input.id) {
      await service.atualizar(input.id, dto);
      return { ok: true, id: input.id };
    }

    const id = await service.criar(dto);
    return { ok: true, id };
  } catch (error) {
    console.error("[salvarAnaliseF3PGI6]", error);
    return {
      ok: false,
      erro: error instanceof Error ? error.message : "Erro ao salvar a análise.",
    };
  }
}