import { requirePagePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

// A mesma rota serve criação (sem id) e edição (?id=) — ambas sob orders:save.
export default async function NovoPedidoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePagePermission(PERMISSIONS.ORDERS_SAVE);
  return children;
}
