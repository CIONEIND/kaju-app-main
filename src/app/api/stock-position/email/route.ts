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
        { message: "Falha ao gerar a imagem do relatório." },
        { status: 400 },
      );
    }

    // Fora da produção o assunto vai marcado com [DESE]
    const finalSubject = applyDeseSubjectPrefix(subject);

    // Remove qualquer prefixo Data URI de imagem png/jpeg
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const fileDate = new Date().toISOString().slice(0, 10);

    const bodyHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;max-width:720px;margin:0 auto;">
        ${body ? `<p style="font-size:15px;line-height:1.6;margin-bottom:24px;">${body.replace(/\n/g, "<br/>")}</p>` : ""}
        <img src="cid:stock-report-image" alt="Relatório de Posição de Estoque - ${fileDate}" style="max-width:100%;border-radius:8px;" />
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
          filename: `posicao-estoque-${fileDate}.png`,
          contentId: "stock-report-image",
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

    // Upsert em cada destinatário para popular a lista de "Recentes"
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