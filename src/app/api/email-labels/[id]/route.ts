import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    await requirePermission(PERMISSIONS.EMAIL_LABELS_MANAGE);
    const label = await prisma.emailLabel.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            recipient: { select: { id: true, email: true, label: true } },
          },
        },
      },
    });
    if (!label) {
      return Response.json(
        { message: "Etiqueta não encontrada." },
        { status: 404 },
      );
    }
    return Response.json(label);
  } catch {
    return Response.json({ message: "Não autorizado." }, { status: 401 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    await requirePermission(PERMISSIONS.EMAIL_LABELS_MANAGE);
    const { name, emails }: { name: string; emails: string[] } =
      await request.json();

    if (!name?.trim()) {
      return Response.json({ message: "Nome é obrigatório." }, { status: 400 });
    }

    const members = await ensureRecipients(emails ?? []);

    // Replace all members in a transaction
    const label = await prisma.$transaction(async (tx) => {
      await tx.emailLabelMember.deleteMany({ where: { labelId: id } });
      return tx.emailLabel.update({
        where: { id },
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
    });

    return Response.json(label);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar etiqueta.";
    return Response.json({ message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    await requirePermission(PERMISSIONS.EMAIL_LABELS_MANAGE);
    await prisma.emailLabel.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao remover etiqueta.";
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
