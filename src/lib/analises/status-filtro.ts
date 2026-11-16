import type { FiltroCentral, StatusAnalise } from "./tipos";

export interface FiltroResolvido {
  status: StatusAnalise;
  filtro: FiltroCentral;
}

/** Data local no formato YYYY-MM-DD (sem deslocamento de fuso) */
function hojeISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Define o status efetivo, injeta o autor quando for rascunho
 * e aplica o período padrão do dia quando nenhuma data foi informada.
 *
 * Rascunho é fila de trabalho em andamento, não histórico:
 * por isso ele NÃO restringe por período — o autor sempre vê
 * os próprios rascunhos, mesmo os de dias anteriores.
 */
export function resolverFiltroStatus(
  filtro: FiltroCentral,
  cdUsrTopManager: number | null,
): FiltroResolvido {
  const status: StatusAnalise = filtro.status ?? "concluida";
  const hoje = hojeISO();

  /* Rascunho ignora o período; concluída usa o dia quando nada foi informado */
  const usaPeriodo = status !== "rascunho";

  return {
    status,
    filtro: {
      ...filtro,
      status,
      dtInicial: usaPeriodo ? (filtro.dtInicial ?? hoje) : undefined,
      dtFinal: usaPeriodo ? (filtro.dtFinal ?? hoje) : undefined,
      responsavelCdUsr:
        status === "rascunho" ? (cdUsrTopManager ?? -1) : undefined,
    },
  };
}

/** Coluna `Status` do banco: 0 = rascunho, 1 = concluída. */
export function statusDoCard(valor: number | undefined): StatusAnalise {
  return valor === 0 ? "rascunho" : "concluida";
}

/** Inverso de `statusDoCard`: converte o status da UI no tinyint da coluna. */
export function statusParaNumero(status: StatusAnalise | undefined): number {
  return status === "rascunho" ? 0 : 1;
}