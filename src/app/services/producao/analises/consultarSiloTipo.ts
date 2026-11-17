"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { buscarParametrosAnalise } from "@/lib/analises/parametros";
import type { GeometriaSilo } from "@/lib/analises/calculo-silo";

export interface ParametrosSiloTipo {
  geometria: GeometriaSilo;
  pesoKgM3: number;
  safra: string;
}

export type ConsultarSiloTipoResult =
  | { ok: true; dados: ParametrosSiloTipo }
  | { ok: false; erro: string };

/**
 * Resolve geometria do silo e peso específico do tipo na data informada.
 *
 * Chamada sempre que o silo ou o tipo mudam no formulário, para que o
 * painel ao vivo use os parâmetros vigentes — e não os do carregamento
 * inicial da página.
 */
export async function consultarSiloTipo(
  siloId: number,
  tipoId: number,
  data: string,
): Promise<ConsultarSiloTipoResult> {
  try {
    const usuario = await getUsuarioAtual();
    if (!usuario) return { ok: false, erro: "Sessão expirada." };
    await requirePermission(PERMISSIONS.ANALISES_VIEW);

    if (!Number.isInteger(siloId) || siloId <= 0) {
      return { ok: false, erro: "Silo inválido." };
    }
    if (!Number.isInteger(tipoId) || tipoId <= 0) {
      return { ok: false, erro: "Tipo de análise inválido." };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return { ok: false, erro: "Data inválida." };
    }

    const referencia = new Date(`${data}T00:00:00`);
    const { geometria, peso } = await buscarParametrosAnalise(
      siloId,
      tipoId,
      referencia,
    );

    return {
      ok: true,
      dados: {
        geometria,
        pesoKgM3: peso.valorKgM3,
        safra: peso.safra,
      },
    };
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Não foi possível carregar os parâmetros do silo.";
    return { ok: false, erro: msg };
  }
}