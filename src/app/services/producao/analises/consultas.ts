import type {
  DetalheAnalise,
  FiltroCentral,
  ResultadoCentral,
} from "@/lib/analises/tipos";
import type { TipoFormulario } from "@/lib/analises/registro";
import { consultarCentralF3PGI6, carregarF3PGI6 } from "./consultarCentralF3PGI6";
import { consultarCentralF6PGI6, carregarF6PGI6 } from "./consultarCentralF6PGI6";
import { consultarCentralLCC, carregarLCC } from "./consultarCentralLCC";

export interface ConsultaFormulario {
  consultar: (filtro: FiltroCentral) => Promise<ResultadoCentral>;
  carregar: (id: number) => Promise<DetalheAnalise | null>;
}

export const CONSULTAS: Record<TipoFormulario, ConsultaFormulario> = {
  F3PGI6: { consultar: consultarCentralF3PGI6, carregar: carregarF3PGI6 },
  F6PGI6: { consultar: consultarCentralF6PGI6, carregar: carregarF6PGI6 },
  LCC: { consultar: consultarCentralLCC, carregar: carregarLCC },
};