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

const MAX_BYTES = 5 * 1024 * 1024; // limite do Resend por anexo
const CID = "relatorio-posicao-estoque";

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

    // Aceita data URI (png/jpeg) ou base64 puro
    const base64Data = imageBase64
      .replace(/^data:image\/(png|jpeg);base64,/, "")
      .replace(/\s/g, "");

    const bytes = Math.ceil((base64Data.length * 3) / 4);
    if (bytes > MAX_BYTES) {
      return Response.json(
        { message: "Imagem acima de 5 MB. Reduza o recorte e tente novamente." },
        { status: 413 },
      );
    }

    const finalSubject = applyDeseSubjectPrefix(subject);
    const fileDate = new Date().toISOString().slice(0, 10);

    const bodyHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;max-width:720px;margin:0 auto;">
        ${body ? `<p style="font-size:15px;line-height:1.6;margin-bottom:24px;">${escapeHtml(body).replace(/\n/g, "<br/>")}</p>` : ""}
        <img src="cid:${CID}" alt="Posição de estoque" style="max-width:100%;border-radius:8px;" />
      </div>
    `;

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipients[0],
      bcc: recipients.length > 1 ? recipients.slice(1) : undefined,
      subject: finalSubject,
      html: bodyHtml,
      attachments: [
        {
          content: base64Data,
          filename: `posicao-estoque-${fileDate}.png`,
          contentId: CID,
          contentType: "image/png",
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

    await Promise.all(
      recipients.map((email) =>
        prisma.emailRecipient.upsert({
          where: { email },
          create: { email },
          update: { useCount: { increment: 1 }, lastUsedAt: new Date() },
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