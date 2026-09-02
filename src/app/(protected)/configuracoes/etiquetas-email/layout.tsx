import { requirePagePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function EtiquetasEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePagePermission(PERMISSIONS.EMAIL_LABELS_MANAGE);
  return children;
}
