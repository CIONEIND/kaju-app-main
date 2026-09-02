"use client";

import { createContext, useContext } from "react";
import type { Permission } from "@/lib/rbac/permissions";

/**
 * Permissões do usuário logado, disponibilizadas ao client para esconder/
 * desabilitar ações que ele não pode executar. É apenas UX — a segurança de
 * verdade está nas server actions/rotas (`requirePermission`). Preenchido pelo
 * layout protegido a partir de `getCurrentUserAccess()`.
 */
const PermissionsContext = createContext<readonly string[]>([]);

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: readonly string[];
  children: React.ReactNode;
}) {
  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

/** `true` se o usuário logado tem a permissão informada. */
export function useHasPermission(permission: Permission): boolean {
  return useContext(PermissionsContext).includes(permission);
}

/** `true` se o usuário tem ao menos uma das permissões informadas. */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const granted = useContext(PermissionsContext);
  return permissions.some((permission) => granted.includes(permission));
}
