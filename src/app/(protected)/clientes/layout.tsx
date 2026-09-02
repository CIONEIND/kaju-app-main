import { requirePagePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function ClientesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePagePermission(PERMISSIONS.CLIENTS_VIEW);
  return children;
}
