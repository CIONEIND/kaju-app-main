import type { ComponentType } from "react";
import { CONSULTAS } from "@/app/services/producao/analises/consultas";
import { listarOpcoesF3PGI6 } from "@/app/services/producao/analises/listarOpcoesF3PGI6";
import { listarOpcoesF6PGI6 } from "@/app/services/producao/analises/listarOpcoesF6PGI6";
import { listarOpcoesLCC } from "@/app/services/producao/analises/listarOpcoesLCC";
import { REGISTRO_META, type TipoFormulario } from "@/lib/analises/registro";
import type {
    FormularioBaseProps,
    OpcoesFormulario,
} from "@/lib/analises/tipos";
import { FormularioF3PGI6 } from "@/components/producao/analises/FormularioF3PGI6";
import { FormularioF6PGI6 } from "@/components/producao/analises/FormularioF6PGI6";
import { FormularioLCC } from "@/components/producao/analises/FormularioLCC";

const COMPONENTES: Record<TipoFormulario, ComponentType<FormularioBaseProps>> = {
    F3PGI6: FormularioF3PGI6,
    F6PGI6: FormularioF6PGI6,
    LCC: FormularioLCC,
};

const OPCOES: Record<TipoFormulario, () => Promise<OpcoesFormulario>> = {
    F3PGI6: listarOpcoesF3PGI6,
    F6PGI6: listarOpcoesF6PGI6,
    LCC: listarOpcoesLCC,
};

export const FORMULARIOS = Object.fromEntries(
    (Object.keys(REGISTRO_META) as TipoFormulario[]).map((tipo) => [
        tipo,
        {
            ...REGISTRO_META[tipo],
            ...CONSULTAS[tipo],
            componente: COMPONENTES[tipo],
            listarOpcoes: OPCOES[tipo],
        },
    ]),
) as Record<
    TipoFormulario,
    (typeof REGISTRO_META)[TipoFormulario] &
    (typeof CONSULTAS)[TipoFormulario] & {
        componente: ComponentType<FormularioBaseProps>;
        listarOpcoes: () => Promise<OpcoesFormulario>;
    }
>;