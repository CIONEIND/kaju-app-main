/**
 * Catálogo de permissões do RBAC.
 *
 * Permissões são aplicadas em código, então o catálogo é **fixo aqui** — só a
 * atribuição de permissões a papéis é dinâmica (fica no banco, em `Role.permissions`).
 * Criar uma permissão nova só faz sentido junto com o código que a verifica.
 *
 * Este módulo é **puro** (sem `"use server"`, sem imports de servidor): ele é
 * importado tanto pelo servidor quanto pelo seed do Prisma (`prisma/seed.ts`).
 */

export const PERMISSIONS = {
  // Pedidos
  ORDERS_VIEW: "orders:view",
  ORDERS_SAVE: "orders:save",
  ORDERS_UPDATE_STATUS: "orders:updateStatus",
  ORDERS_SEND_EMAIL: "orders:sendEmail",
  // Estoque
  STOCK_VIEW: "stock:view",
  // Clientes
  CLIENTS_VIEW: "clients:view",
  CLIENTS_SAVE: "clients:save",
  // Configurações
  EMAIL_LABELS_MANAGE: "emailLabels:manage",
  // Administração
  RBAC_MANAGE: "rbac:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDefinition {
  key: Permission;
  label: string;
  description: string;
}

export interface PermissionCategory {
  category: string;
  permissions: PermissionDefinition[];
}

/**
 * Catálogo agrupado por categoria — a UI de administração renderiza os
 * checkboxes a partir daqui.
 */
export const PERMISSION_CATALOG: PermissionCategory[] = [
  {
    category: "Pedidos",
    permissions: [
      {
        key: PERMISSIONS.ORDERS_VIEW,
        label: "Visualizar pedidos",
        description: "Ver a lista e os detalhes dos pedidos.",
      },
      {
        key: PERMISSIONS.ORDERS_SAVE,
        label: "Cadastrar e editar pedidos",
        description:
          "Criar novos pedidos de compra e alterar itens e dados dos existentes.",
      },
      {
        key: PERMISSIONS.ORDERS_UPDATE_STATUS,
        label: "Alterar status de pedidos",
        description: "Mudar status de pedido, financeiro e de estoque.",
      },
      {
        key: PERMISSIONS.ORDERS_SEND_EMAIL,
        label: "Enviar pedidos por e-mail",
        description: "Disparar e-mails de pedido aos destinatários.",
      },
    ],
  },
  {
    category: "Estoque",
    permissions: [
      {
        key: PERMISSIONS.STOCK_VIEW,
        label: "Visualizar estoque",
        description: "Consultar a posição de estoque.",
      },
    ],
  },
  {
    category: "Clientes",
    permissions: [
      {
        key: PERMISSIONS.CLIENTS_VIEW,
        label: "Visualizar clientes",
        description: "Consultar a base de clientes.",
      },
      {
        key: PERMISSIONS.CLIENTS_SAVE,
        label: "Cadastrar e editar clientes",
        description: "Criar novos clientes e alterar dados dos existentes.",
      },
    ],
  },
  {
    category: "Configurações",
    permissions: [
      {
        key: PERMISSIONS.EMAIL_LABELS_MANAGE,
        label: "Gerenciar etiquetas de e-mail",
        description: "Criar, editar e remover etiquetas de e-mail.",
      },
    ],
  },
  {
    category: "Administração",
    permissions: [
      {
        key: PERMISSIONS.RBAC_MANAGE,
        label: "Gerenciar papéis e permissões",
        description:
          "Acessar a área de administração: papéis, permissões e atribuição de usuários.",
      },
    ],
  },
];

/** Todas as chaves de permissão do catálogo. */
export const ALL_PERMISSIONS: Permission[] = PERMISSION_CATALOG.flatMap(
  (group) => group.permissions.map((permission) => permission.key),
);

/**
 * Permissões de feature (tudo, exceto `rbac:manage`). É o conjunto do papel
 * "Legado", atribuído às contas que já existiam antes do RBAC.
 */
export const FEATURE_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (permission) => permission !== PERMISSIONS.RBAC_MANAGE,
);

/**
 * Nomes dos papéis criados pelo seed de RBAC ([prisma/seed-rbac.ts]).
 * `admin` é papel de sistema (superusuário, não editável); os outros dois são
 * pontos de partida editáveis pelo admin.
 */
export const RBAC_ROLE_NAMES = {
  admin: "Administrador",
  legacy: "Legado",
  newUser: "Novo usuário",
} as const;

/**
 * Permissões do papel "Novo usuário": apenas leitura básica. Também é o
 * fallback para usuários sem papel — assim uma conta nova nunca nasce com
 * acesso total.
 */
export const NEW_USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.ORDERS_VIEW,
  PERMISSIONS.STOCK_VIEW,
  PERMISSIONS.CLIENTS_VIEW,
];

const PERMISSION_SET = new Set<string>(ALL_PERMISSIONS);

/** Type guard: a string é uma permissão conhecida do catálogo? */
export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && PERMISSION_SET.has(value);
}

const PERMISSION_LABELS = new Map<Permission, string>(
  PERMISSION_CATALOG.flatMap((group) =>
    group.permissions.map(
      (permission) => [permission.key, permission.label] as const,
    ),
  ),
);

/** Rótulo pt-BR de uma permissão (ou a própria chave, se desconhecida). */
export function permissionLabel(permission: string): string {
  return PERMISSION_LABELS.get(permission as Permission) ?? permission;
}
