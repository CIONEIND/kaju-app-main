import type { FiltroCentral, StatusAnalise } from "./tipos";

interface ResultadoFiltro {
  status: StatusAnalise;
  filtro: FiltroCentral;
}

/**
 * Normaliza o filtro da central conforme a situação escolhida.
 *
 * Rascunhos são sempre do próprio usuário — o operador só enxerga o que
 * ele mesmo começou. Análises concluídas não filtram por responsável.
 */
export function resolverFiltroStatus(
  filtro: FiltroCentral,
  cdUsrTopManager: number | null,
): ResultadoFiltro {
  const status: StatusAnalise = filtro.status ?? "concluida";

  if (status === "rascunho") {
    /*
     * Rascunho sem vínculo com o TopManager não tem como ser filtrado
     * por responsável — devolve um filtro impossível em vez de vazar
     * rascunhos de terceiros.
     */
    if (cdUsrTopManager === null) {
      return {
        status,
        filtro: { ...filtro, status, responsavelCdUsr: -1 },
      };
    }
    return {
      status,
      filtro: {
        ...filtro,
        status,
        responsavelCdUsr: cdUsrTopManager,
        /* Rascunho não filtra por período — o operador vê tudo em aberto */
        dtInicial: undefined,
        dtFinal: undefined,
      },
    };
  }

  return {
    status,
    filtro: {
      ...filtro,
      status,
      responsavelCdUsr: undefined,
    },
  };
}

/** Converte o status numérico do banco para o rótulo do card */
export function statusDoCard(status: number | string | null): StatusAnalise {
  if (status === 0 || status === "0" || status === "rascunho") {
    return "rascunho";
  }
  return "concluida";
}