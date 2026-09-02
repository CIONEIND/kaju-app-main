import { requirePagePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function EditarClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePagePermission(PERMISSIONS.CLIENTS_SAVE);
  return children;
}
