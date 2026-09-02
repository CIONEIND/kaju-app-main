import { prisma } from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function GET() {
  try {
    // Lista de contatos usada tanto pelas etiquetas quanto pelos envios de
    // e-mail (pedido e estoque) — basta ter uma dessas permissões.
    await requireAnyPermission([
      PERMISSIONS.EMAIL_LABELS_MANAGE,
      PERMISSIONS.ORDERS_SEND_EMAIL,
      PERMISSIONS.STOCK_VIEW,
    ]);

    const recipients = await prisma.emailRecipient.findMany({
      orderBy: [{ lastUsedAt: "desc" }, { useCount: "desc" }],
      select: { id: true, email: true, label: true, useCount: true },
      take: 30,
    });

    return Response.json(recipients);
  } catch {
    return Response.json({ message: "Não autorizado." }, { status: 401 });
  }
}
