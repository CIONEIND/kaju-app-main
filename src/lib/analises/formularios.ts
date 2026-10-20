import { FormularioF3PGI6 } from "@/components/producao/analises/FormularioF3PGI6";

export const FORMULARIOS = {
  F3PGI6: {
    componente: FormularioF3PGI6,
    titulo: "F3PGI6",
    descricao: "Análise de laboratório F3PGI6",
  },
  // Próximo formulário:
  // F3PGI7: { componente: FormularioF3PGI7, titulo: "F3PGI7", descricao: "..." },
} as const;

export type TipoFormulario = keyof typeof FORMULARIOS;

export function isTipoFormulario(valor: string): valor is TipoFormulario {
  return valor in FORMULARIOS;
}