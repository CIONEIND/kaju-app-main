import { requirePagePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function PedidosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePagePermission(PERMISSIONS.ORDERS_VIEW);
  return children;
}
