import type { Knex } from "knex";
import type { FiltroCentral } from "@/lib/analises/tipos";

/** Rascunho é privado: só o autor vê. Concluída é pública. */
export function aplicarStatus(
  q: Knex.QueryBuilder,
  filtro: FiltroCentral,
): void {
  if (filtro.status === "rascunho") {
    q.where("C.Status", 0);
    if (filtro.responsavelCdUsr !== undefined) {
      q.where("C.Responsavel", filtro.responsavelCdUsr);
    }
  } else {
    q.where("C.Status", 1);
  }
}