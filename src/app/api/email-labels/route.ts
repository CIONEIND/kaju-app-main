import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.EMAIL_LABELS_MANAGE);
    const labels = await prisma.emailLabel.findMany({
      orderBy: { name: "asc" },
      include: {
        members: {
          include: {
            recipient: { select: { id: true, email: true, label: true } },
          },
        },
      },
    });
    return Response.json(labels);
  } catch {
    return Response.json({ message: "Não autorizado." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.EMAIL_LABELS_MANAGE);
    const { name, emails }: { name: string; emails: string[] } =
      await request.json();

    if (!name?.trim()) {
      return Response.json({ message: "Nome é obrigatório." }, { status: 400 });
    }

    // Ensure all email addresses exist in EmailRecipient
    const members = await ensureRecipients(emails ?? []);

    const label = await prisma.emailLabel.create({
      data: {
        name: name.trim(),
        members: {
          create: members.map((r) => ({ recipientId: r.id })),
        },
      },
      include: {
        members: {
          include: {
            recipient: { select: { id: true, email: true, label: true } },
          },
        },
      },
    });

    return Response.json(label, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar etiqueta.";
    return Response.json({ message }, { status: 400 });
  }
}

async function ensureRecipients(emails: string[]) {
  const unique = [
    ...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
  ];
  return Promise.all(
    unique.map((email) =>
      prisma.emailRecipient.upsert({
        where: { email },
        create: { email },
        update: {},
        select: { id: true },
      }),
    ),
  );
}
