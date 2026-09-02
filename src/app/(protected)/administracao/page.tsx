import { notFound } from "next/navigation";
import { listRoles, listUsers } from "@/app/services/admin/rbacService";
import { getCurrentUserAccess } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { AdminRbacClient } from "./AdminRbacClient";

export const metadata = {
  title: "Administração — Papéis e permissões",
};

export default async function AdministracaoPage() {
  const access = await getCurrentUserAccess();

  // Não vaza a existência da rota para quem não é admin: 404 direto.
  if (!access?.permissions.has(PERMISSIONS.RBAC_MANAGE)) {
    notFound();
  }

  const [roles, users] = await Promise.all([listRoles(), listUsers()]);

  return (
    <AdminRbacClient
      currentUserId={access.id}
      initialRoles={roles}
      initialUsers={users}
    />
  );
}
