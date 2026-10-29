import type { FiltroCentral, StatusAnalise } from "./tipos";

export interface FiltroResolvido {
  status: StatusAnalise;
  filtro: FiltroCentral;
}

/**
 * Define o status efetivo e injeta o autor quando for rascunho.
 * Rascunho é privado: o `cdUsrResponsavel` nunca vem da URL.
 */
export function resolverFiltroStatus(
  filtro: FiltroCentral,
  cdUsrTopManager: number | null,
): FiltroResolvido {
  const status: StatusAnalise = filtro.status ?? "concluida";

  return {
    status,
    filtro: {
      ...filtro,
      status,
      responsavelCdUsr:
        status === "rascunho" ? (cdUsrTopManager ?? -1) : undefined,
    },
  };
}

/** Coluna `Status` do banco: 0 = rascunho, 1 = concluída. */
export function statusDoCard(valor: number | undefined): StatusAnalise {
  return valor === 0 ? "rascunho" : "concluida";
}