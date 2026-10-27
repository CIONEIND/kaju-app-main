"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { REGISTRO_META, isTipoFormulario } from "@/lib/analises/registro";
import { montarHtmlAnalises } from "@/lib/email/analises-template";
import { resend, EMAIL_FROM } from "@/lib/email/resend";
import { applyDeseSubjectPrefix } from "@/lib/email/subject";
import type { FiltroCentral } from "@/lib/analises/tipos";
import { CONSULTAS } from "./consultas";

export interface EnviarAnalisesInput {
  tipo: string;
  destinatarios: string[];
  filtro: FiltroCentral;
  observacao?: string;
}

export type EnviarAnalisesResult =
  | { ok: true; enviados: number }
  | { ok: false; erro: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function enviarAnalisesPorEmail(
  input: EnviarAnalisesInput,
): Promise<EnviarAnalisesResult> {
  try {
    const usuario = await getUsuarioAtual();
    if (!usuario) return { ok: false, erro: "Sessão expirada." };
    await requirePermission(PERMISSIONS.ANALISES_SEND);

    if (!isTipoFormulario(input.tipo)) {
      return { ok: false, erro: "Formulário inválido." };
    }

    const destinatarios = [
      ...new Set(
        input.destinatarios.map((e) => e.trim().toLowerCase()).filter(Boolean),
      ),
    ].filter((e) => EMAIL.test(e));

    if (destinatarios.length === 0) {
      return { ok: false, erro: "Informe ao menos um e-mail válido." };
    }
    if (destinatarios.length > 20) {
      return { ok: false, erro: "Máximo de 20 destinatários por envio." };
    }

    const meta = REGISTRO_META[input.tipo];
    const { itens, resumos } = await CONSULTAS[input.tipo].consultar({
      ...input.filtro,
      limite: 500,
      offset: 0,
    });

    if (itens.length === 0) {
      return { ok: false, erro: "Nenhum registro para o filtro selecionado." };
    }

    const html = montarHtmlAnalises({
      titulo: meta.titulo,
      itens,
      resumos,
      filtro: input.filtro,
      observacao: input.observacao,
      usuario: usuario.nome,
    });

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: destinatarios[0],
      bcc: destinatarios.slice(1),
      subject: applyDeseSubjectPrefix(
        `Análises ${meta.titulo} — ${itens.length} registro${itens.length !== 1 ? "s" : ""}`,
      ),
      html,
    });

    if (error) return { ok: false, erro: error.message };

    return { ok: true, enviados: destinatarios.length };
  } catch (e) {
    return {
      ok: false,
      erro: e instanceof Error ? e.message : "Falha no envio.",
    };
  }
}