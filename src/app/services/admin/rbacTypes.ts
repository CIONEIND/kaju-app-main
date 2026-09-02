/**
 * Tipos de saída das server actions de RBAC.
 *
 * Ficam num módulo separado (sem `"use server"`) porque um módulo de server
 * actions só deve exportar funções async — a convenção do projeto mantém os
 * tipos de serviço em arquivos à parte (ver `api-types.ts` dos pedidos).
 */

export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
}

export interface UserSummary {
  id: string;
  name: string | null;
  email: string | null;
  blocked: boolean;
  role: { id: string; name: string } | null;
}
