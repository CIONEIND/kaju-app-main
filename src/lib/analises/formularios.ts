import type { ComponentType } from "react";
import { FormularioF3PGI6 } from "@/components/producao/analises/FormularioF3PGI6";
import { FormularioF6PGI6 } from "@/components/producao/analises/FormularioF6PGI6";
import { consultarCentralF3PGI6, carregarF3PGI6 } from "@/app/services/producao/analises/consultarCentralF3PGI6";
import { consultarCentralF6PGI6, carregarF6PGI6 } from "@/app/services/producao/analises/consultarCentralF6PGI6";
import { listarOpcoesF3PGI6 } from "@/app/services/producao/analises/listarOpcoesF3PGI6";
import { listarOpcoesF6PGI6 } from "@/app/services/producao/analises/listarOpcoesF6PGI6";
import type {
  DetalheAnalise,
  FiltroCentral,
  FiltrosDisponiveis,
  FormularioBaseProps,
  OpcoesFormulario,
  ResultadoCentral,
} from "./tipos";

export interface FormularioRegistro {
  componente: ComponentType<FormularioBaseProps>;
  titulo: string;
  descricao: string;
  filtros: FiltrosDisponiveis;
  consultar: (filtro: FiltroCentral) => Promise<ResultadoCentral>;
  listarOpcoes: () => Promise<OpcoesFormulario>;
  carregar: (id: number) => Promise<DetalheAnalise | null>;
}

export const FORMULARIOS: Record<string, FormularioRegistro> = {
  F3PGI6: {
    componente: FormularioF3PGI6,
    titulo: "F3PGI6",
    descricao: "Amêndoa e casca — 3 medições de cada",
    filtros: { periodo: true, lote: true, tipo: true },
    consultar: consultarCentralF3PGI6,
    listarOpcoes: listarOpcoesF3PGI6,
    carregar: carregarF3PGI6,
  },
  F6PGI6: {
    componente: FormularioF6PGI6,
    titulo: "F6PGI6",
    descricao: "Cubagem e consumo por silo",
    filtros: { periodo: true, lote: true, tipo: true, silo: true },
    consultar: consultarCentralF6PGI6,
    listarOpcoes: listarOpcoesF6PGI6,
    carregar: carregarF6PGI6,
  },
};

export type TipoFormulario = keyof typeof FORMULARIOS;

export const TIPOS_FORMULARIO = Object.keys(FORMULARIOS);

export const TIPO_PADRAO = "F3PGI6";

export function isTipoFormulario(valor: string): valor is TipoFormulario {
  return valor in FORMULARIOS;
}