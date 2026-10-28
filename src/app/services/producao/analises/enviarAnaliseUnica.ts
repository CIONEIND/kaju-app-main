"use server";

import { getUsuarioAtual } from "@/lib/auth/auth";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { REGISTRO_META, isTipoFormulario } from "@/lib/analises/registro";
import { montarHtmlAnalises } from "@/lib/email/analises-template";
import { resend, EMAIL_FROM } from "@/lib/email/resend";
import { applyDeseSubjectPrefix } from "@/lib/email/subject";
import type { CardAnaliseDados } from "@/lib/analises/tipos";
import { CONSULTAS } from "./consultas";

export interface EnviarAnaliseUnicaInput {
  tipo: string;
  id: number;
  destinatarios: string[];
  observacao?: string;
  assunto?: string;
  pdfBase64?: string;
}

export type EnviarAnaliseUnicaResult =
  | { ok: true; enviados: number }
  | { ok: false; erro: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_PDF = 4.5 * 1024 * 1024;

export async function enviarAnaliseUnica(
  input: EnviarAnaliseUnicaInput,
): Promise<EnviarAnaliseUnicaResult> {
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

    const detalhe = await CONSULTAS[input.tipo].carregar(input.id);
    if (!detalhe) return { ok: false, erro: "Análise não encontrada." };

    const card: CardAnaliseDados = {
      id: detalhe.id,
      titulo: detalhe.titulo,
      linhas: detalhe.identificacao,
      metricas: detalhe.grupos.flatMap((g) => g.itens),
    };

    const meta = REGISTRO_META[input.tipo];
    const html = montarHtmlAnalises({
      titulo: `${meta.titulo} · ${detalhe.titulo}`,
      itens: [card],
      filtro: {},
      observacao: input.observacao,
      usuario: usuario.nome,
    });

    let base64: string | undefined;
    if (input.pdfBase64) {
      base64 = input.pdfBase64
        .replace(/^data:application\/pdf;base64,/, "")
        .replace(/\s/g, "");

      if (base64.length * 0.75 > MAX_PDF) {
        return { ok: false, erro: "PDF acima de 4,5 MB." };
      }
    }

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: destinatarios[0],
      bcc: destinatarios.length > 1 ? destinatarios.slice(1) : undefined,
      subject: applyDeseSubjectPrefix(
        input.assunto?.trim() ||
          `Análise ${meta.titulo} #${detalhe.id} — ${detalhe.titulo}`,
      ),
      html,
      attachments: base64
        ? [
            {
              filename: `analise-${input.tipo}-${detalhe.id}.pdf`,
              content: base64,
              contentType: "application/pdf",
            },
          ]
        : undefined,
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