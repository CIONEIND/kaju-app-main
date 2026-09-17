import { EMAIL_FROM, resend } from "@/lib/email/resend";
import { applyDeseSubjectPrefix } from "@/lib/email/subject";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

interface SendEmailBody {
  recipients: string[];
  subject: string;
  body: string;
  imageBase64: string;
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.STOCK_VIEW);
    const { recipients, subject, body, imageBase64 }: SendEmailBody =
      await request.json();

    if (!recipients?.length) {
      return Response.json(
        { message: "Informe ao menos um destinatário." },
        { status: 400 },
      );
    }

    if (!imageBase64) {
      return Response.json(
        { message: "Falha ao gerar o relatório em PDF." },
        { status: 400 },
      );
    }

    // Fora da produção o assunto vai marcado com [DESE]
    const finalSubject = applyDeseSubjectPrefix(subject);

    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, "");

    const fileDate = new Date().toISOString().slice(0, 10);

    const bodyHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;max-width:720px;margin:0 auto;">
        ${body ? `<p style="font-size:15px;line-height:1.6;margin-bottom:24px;">${body.replace(/\n/g, "<br/>")}</p>` : ""}
        <p style="font-size:14px;line-height:1.6;color:#334155;">
          Segue em anexo o relatório de posição de estoque em PDF.
        </p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipients,
      subject: finalSubject,
      html: bodyHtml,
      attachments: [
        {
          content: base64Data,
          filename: `posicao-estoque-${fileDate}.pdf`,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json(
        { message: "Falha ao enviar e-mail. Tente novamente." },
        { status: 500 },
      );
    }

    // Upsert each recipient into EmailRecipient (feeds the "Recentes" list)
    await Promise.all(
      recipients.map((email) =>
        prisma.emailRecipient.upsert({
          where: { email },
          create: { email },
          update: {
            useCount: { increment: 1 },
            lastUsedAt: new Date(),
          },
        }),
      ),
    );

    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao enviar e-mail.";
    return Response.json({ message }, { status: 400 });
  }
}
