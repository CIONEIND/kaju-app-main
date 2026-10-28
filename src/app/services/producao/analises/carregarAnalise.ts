"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { isTipoFormulario } from "@/lib/analises/registro";
import type { DetalheAnalise } from "@/lib/analises/tipos";
import { CONSULTAS } from "./consultas";

export async function carregarAnalise(
  tipo: string,
  id: number,
): Promise<DetalheAnalise | null> {
  const usuario = await getUsuarioAtual();
  if (!usuario) throw new Error("Sessão expirada.");
  await requirePermission(PERMISSIONS.ANALISES_VIEW);

  if (!isTipoFormulario(tipo)) throw new Error("Formulário inválido.");

  return CONSULTAS[tipo].carregar(id);
}