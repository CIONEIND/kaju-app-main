"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/access";
import { isPermission, PERMISSIONS } from "@/lib/rbac/permissions";
import type { RoleSummary, UserSummary } from "./rbacTypes";

// ─── Resultados (formas planas, prontas para o client) ──────────────────────

type RoleResult =
  | { success: true; role: RoleSummary }
  | { success: false; error: string };

type UserResult =
  | { success: true; user: UserSummary }
  | { success: false; error: string };

type DeleteResult = { success: true } | { success: false; error: string };

// ─── Validação ──────────────────────────────────────────────────────────────

const roleInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe um nome para o papel.")
    .max(50, "Nome muito longo (máx. 50 caracteres)."),
  description: z
    .string()
    .trim()
    .max(200, "Descrição muito longa (máx. 200 caracteres).")
    .optional()
    .transform((value) => (value ? value : null)),
  permissions: z
    .array(z.string())
    .transform((list) => [...new Set(list)])
    .refine(
      (list) => list.every(isPermission),
      "Uma ou mais permissões são inválidas.",
    ),
});

type RoleInput = z.input<typeof roleInputSchema>;

// ─── Helpers internos ─────────────────────────────────────────────────────────

function toRoleSummary(role: {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  _count: { users: number };
}): RoleSummary {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions,
    isSystem: role.isSystem,
    userCount: role._count.users,
  };
}

const roleSelect = {
  id: true,
  name: true,
  description: true,
  permissions: true,
  isSystem: true,
  _count: { select: { users: true } },
} as const;

/**
 * Um papel concede administração se for de sistema (superusuário) ou se tiver a
 * permissão `rbac:manage` no array.
 */
function roleGrantsAdmin(role: {
  isSystem: boolean;
  permissions: string[];
}): boolean {
  return role.isSystem || role.permissions.includes(PERMISSIONS.RBAC_MANAGE);
}

/** Conta admins ativos, opcionalmente excluindo um usuário/papel. */
function countActiveAdmins(options?: {
  excludeUserId?: string;
  excludeRoleId?: string;
}): Promise<number> {
  return prisma.user.count({
    where: {
      blocked: false,
      ...(options?.excludeUserId ? { id: { not: options.excludeUserId } } : {}),
      role: {
        ...(options?.excludeRoleId
          ? { id: { not: options.excludeRoleId } }
          : {}),
        OR: [
          { isSystem: true },
          { permissions: { has: PERMISSIONS.RBAC_MANAGE } },
        ],
      },
    },
  });
}

function isUniqueNameError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

// ─── Leituras ─────────────────────────────────────────────────────────────────

export async function listRoles(): Promise<RoleSummary[]> {
  await requirePermission(PERMISSIONS.RBAC_MANAGE);

  const roles = await prisma.role.findMany({
    select: roleSelect,
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return roles.map(toRoleSummary);
}

export async function listUsers(): Promise<UserSummary[]> {
  await requirePermission(PERMISSIONS.RBAC_MANAGE);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      blocked: true,
      role: { select: { id: true, name: true } },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  return users;
}

// ─── Mutações de papel ─────────────────────────────────────────────────────────

export async function createRole(input: RoleInput): Promise<RoleResult> {
  try {
    await requirePermission(PERMISSIONS.RBAC_MANAGE);

    const parsed = roleInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }

    const role = await prisma.role.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        permissions: parsed.data.permissions,
      },
      select: roleSelect,
    });

    return { success: true, role: toRoleSummary(role) };
  } catch (error) {
    if (isUniqueNameError(error)) {
      return { success: false, error: "Já existe um papel com esse nome." };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar papel.",
    };
  }
}

export async function updateRole(
  id: string,
  input: RoleInput,
): Promise<RoleResult> {
  try {
    await requirePermission(PERMISSIONS.RBAC_MANAGE);

    const parsed = roleInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }

    const existing = await prisma.role.findUnique({
      where: { id },
      select: {
        isSystem: true,
        permissions: true,
        _count: { select: { users: true } },
      },
    });

    if (!existing) {
      return { success: false, error: "Papel não encontrado." };
    }

    if (existing.isSystem) {
      return {
        success: false,
        error: "O papel Administrador é do sistema e não pode ser editado.",
      };
    }

    // Guarda anti-lockout: não deixar o sistema sem nenhum administrador.
    const hadManage = existing.permissions.includes(PERMISSIONS.RBAC_MANAGE);
    const willManage = parsed.data.permissions.includes(
      PERMISSIONS.RBAC_MANAGE,
    );
    if (hadManage && !willManage && existing._count.users > 0) {
      const otherAdmins = await countActiveAdmins({ excludeRoleId: id });
      if (otherAdmins === 0) {
        return {
          success: false,
          error:
            "Este é o único papel com administradores. Remover a permissão de administração deixaria o sistema sem admin.",
        };
      }
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        permissions: parsed.data.permissions,
      },
      select: roleSelect,
    });

    return { success: true, role: toRoleSummary(role) };
  } catch (error) {
    if (isUniqueNameError(error)) {
      return { success: false, error: "Já existe um papel com esse nome." };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao atualizar papel.",
    };
  }
}

export async function deleteRole(id: string): Promise<DeleteResult> {
  try {
    await requirePermission(PERMISSIONS.RBAC_MANAGE);

    const existing = await prisma.role.findUnique({
      where: { id },
      select: {
        isSystem: true,
        permissions: true,
        _count: { select: { users: true } },
      },
    });

    if (!existing) {
      return { success: false, error: "Papel não encontrado." };
    }

    if (existing.isSystem) {
      return {
        success: false,
        error: "O papel Administrador é do sistema e não pode ser excluído.",
      };
    }

    if (
      existing.permissions.includes(PERMISSIONS.RBAC_MANAGE) &&
      existing._count.users > 0
    ) {
      const otherAdmins = await countActiveAdmins({ excludeRoleId: id });
      if (otherAdmins === 0) {
        return {
          success: false,
          error:
            "Excluir este papel deixaria o sistema sem nenhum administrador.",
        };
      }
    }

    // onDelete: SetNull → os usuários deste papel ficam sem papel.
    await prisma.role.delete({ where: { id } });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao excluir papel.",
    };
  }
}

// ─── Atribuição de papel a usuário ──────────────────────────────────────────────

export async function assignUserRole(
  userId: string,
  roleId: string | null,
): Promise<UserResult> {
  try {
    await requirePermission(PERMISSIONS.RBAC_MANAGE);

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { isSystem: true, permissions: true } } },
    });

    if (!target) {
      return { success: false, error: "Usuário não encontrado." };
    }

    let newRoleIsAdmin = false;
    if (roleId) {
      const newRole = await prisma.role.findUnique({
        where: { id: roleId },
        select: { isSystem: true, permissions: true },
      });
      if (!newRole) {
        return { success: false, error: "Papel não encontrado." };
      }
      newRoleIsAdmin = roleGrantsAdmin(newRole);
    }

    // Guarda anti-lockout: não remover o último administrador.
    const targetIsAdmin = target.role ? roleGrantsAdmin(target.role) : false;
    if (targetIsAdmin && !newRoleIsAdmin) {
      const otherAdmins = await countActiveAdmins({ excludeUserId: userId });
      if (otherAdmins === 0) {
        return {
          success: false,
          error:
            "Não é possível remover o último administrador do sistema. Promova outro usuário primeiro.",
        };
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { roleId },
      select: {
        id: true,
        name: true,
        email: true,
        blocked: true,
        role: { select: { id: true, name: true } },
      },
    });

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atribuir papel.",
    };
  }
}
