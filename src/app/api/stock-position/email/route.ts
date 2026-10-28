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
  imageWidth?: number;
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const CID = "relatorio-posicao-estoque";

const TIPOS = { "image/png": "png", "image/jpeg": "jpg" } as const;
type MimeAceito = keyof typeof TIPOS;

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
    const { recipients, subject, body, imageBase64, imageWidth }: SendEmailBody =
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

    // Aceita apenas "data:image/png;base64,..." ou "data:image/jpeg;base64,..."
    const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\s]+)$/.exec(
      imageBase64.trim(),
    );

    if (!match) {
      return Response.json(
        { message: "Formato inválido. Envie uma imagem PNG ou JPEG em data URI." },
        { status: 400 },
      );
    }

    const mime = match[1] as MimeAceito;
    const base64 = match[2].replace(/\s/g, "");
    const ext = TIPOS[mime];

    const bytes = Math.ceil((base64.length * 3) / 4);
    if (bytes > MAX_IMAGE_BYTES) {
      return Response.json(
        { message: "Imagem acima do limite de 4 MB. Reduza o recorte." },
        { status: 413 },
      );
    }

    const largura = Math.min(Math.max(imageWidth ?? 640, 320), 640);
    const fileDate = new Date().toISOString().slice(0, 10);
    const finalSubject = applyDeseSubjectPrefix(subject);

    const bodyHtml = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;max-width:680px;margin:0 auto;">
  ${body ? `<p style="font-size:15px;line-height:1.6;margin:0 0 24px;">${escapeHtml(body).replace(/\n/g, "<br/>")}</p>` : ""}
  <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 16px;">
    Segue abaixo o relatório de posição de estoque.
  </p>
  <img
    src="cid:${CID}"
    alt="Relatório de posição de estoque"
    width="${largura}"
    style="display:block;width:100%;max-width:${largura}px;height:auto;border:0;outline:none;"
  />
  <p style="font-size:12px;line-height:1.5;color:#94a3b8;margin:20px 0 0;">
    Relatório gerado em ${fileDate}.
  </p>
</div>`;

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipients[0],
      bcc: recipients.slice(1),
      subject: finalSubject,
      html: bodyHtml,
      attachments: [
        {
          filename: `posicao-estoque-${fileDate}.${ext}`,
          content: base64,
          contentType: mime,
          contentId: CID,
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