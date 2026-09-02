import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ALL_PERMISSIONS,
  isPermission,
  NEW_USER_PERMISSIONS,
  type Permission,
} from "@/lib/rbac/permissions";
import { getCurrentSession } from "@/lib/session";

export interface CurrentUserAccess {
  id: string;
  email: string | null;
  role: {
    id: string;
    name: string;
    isSystem: boolean;
  } | null;
  permissions: Set<Permission>;
}

/**
 * Resolve o usuário logado e suas permissões efetivas numa única query.
 *
 * Regra de permissões:
 * - **papel de sistema** (`isSystem`, ex.: Administrador) → superusuário, todas
 *   as permissões — assim novas permissões do catálogo valem para o admin sem
 *   precisar re-seedar;
 * - **papel comum** → exatamente as permissões salvas no papel;
 * - **sem papel** → só leitura básica (`NEW_USER_PERMISSIONS`), como um "Novo
 *   usuário". Nunca acesso total.
 *
 * Retorna `null` se não houver sessão válida ou se o usuário estiver bloqueado.
 */
export async function getCurrentUserAccess(): Promise<CurrentUserAccess | null> {
  const session = await getCurrentSession();
  const sessionUser = session?.user;

  if (!sessionUser?.id && !sessionUser?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: sessionUser.id
      ? { id: sessionUser.id }
      : { email: sessionUser.email ?? undefined },
    select: {
      id: true,
      email: true,
      blocked: true,
      role: {
        select: { id: true, name: true, isSystem: true, permissions: true },
      },
    },
  });

  if (!user || user.blocked) {
    return null;
  }

  const permissions = new Set<Permission>(
    user.role
      ? user.role.isSystem
        ? ALL_PERMISSIONS
        : user.role.permissions.filter(isPermission)
      : NEW_USER_PERMISSIONS,
  );

  return {
    id: user.id,
    email: user.email,
    role: user.role
      ? { id: user.role.id, name: user.role.name, isSystem: user.role.isSystem }
      : null,
    permissions,
  };
}

/** Verifica se o usuário logado possui a permissão informada. */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const access = await getCurrentUserAccess();
  return access?.permissions.has(permission) ?? false;
}

/**
 * Exige a permissão informada. Lança `Error("Não autorizado.")` se o usuário
 * não a tiver — para uso no topo de server actions e route handlers, no mesmo
 * estilo de `requirePurchaseOrderUser()`.
 */
export async function requirePermission(
  permission: Permission,
): Promise<CurrentUserAccess> {
  const access = await getCurrentUserAccess();

  if (!access?.permissions.has(permission)) {
    throw new Error("Não autorizado.");
  }

  return access;
}

/**
 * Como `requirePermission`, mas basta ter **uma** das permissões da lista. Útil
 * para "building blocks" compartilhados por mais de uma feature (ex.: a posição
 * de estoque é lida tanto pela tela de estoque quanto pela criação de pedido).
 */
export async function requireAnyPermission(
  permissions: Permission[],
): Promise<CurrentUserAccess> {
  const access = await getCurrentUserAccess();

  if (
    !access ||
    !permissions.some((permission) => access.permissions.has(permission))
  ) {
    throw new Error("Não autorizado.");
  }

  return access;
}

/**
 * Gate para **páginas/layouts** (server components): se o usuário não tiver a
 * permissão, responde 404 (`notFound()`), sem vazar a existência da rota.
 */
export async function requirePagePermission(
  permission: Permission,
): Promise<CurrentUserAccess> {
  const access = await getCurrentUserAccess();

  if (!access?.permissions.has(permission)) {
    notFound();
  }

  return access;
}

/** Como `requirePagePermission`, mas aceita qualquer uma das permissões. */
export async function requirePageAnyPermission(
  permissions: Permission[],
): Promise<CurrentUserAccess> {
  const access = await getCurrentUserAccess();

  if (
    !access ||
    !permissions.some((permission) => access.permissions.has(permission))
  ) {
    notFound();
  }

  return access;
}
