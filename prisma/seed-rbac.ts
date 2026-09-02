/**
 * Seed de RBAC — separado do seed do IBGE ([seed.ts]) de propósito: mexe em
 * papéis e usuários, não em dados de referência, e você vai querer rodá-lo em
 * produção sem reprocessar os 5.570 municípios.
 *
 * Rode com:
 *   npm run db:seed:rbac
 *
 * O que ele faz (tudo idempotente):
 *   1. Garante o papel de sistema "Administrador" (superusuário) — mantém as
 *      permissões sincronizadas com o catálogo.
 *   2. Cria "Legado" (todas as permissões, exceto administração) e "Novo
 *      usuário" (leitura básica) se não existirem. NÃO sobrescreve edições
 *      feitas pelo admin depois (create-only).
 *   3. Migra contas existentes SEM papel para "Legado".
 *   4. Se `BOOTSTRAP_ADMIN_EMAIL` estiver definido (lista separada por vírgula),
 *      promove esses usuários a "Administrador".
 *
 * `dotenv/config` carrega o .env em dev; em produção as variáveis de ambiente
 * reais têm precedência (o dotenv não sobrescreve o que já existe).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  ALL_PERMISSIONS,
  FEATURE_PERMISSIONS,
  NEW_USER_PERMISSIONS,
  RBAC_ROLE_NAMES,
} from "../src/lib/rbac/permissions";

// Sem fallback para localhost de propósito: este seed roda em produção, e cair
// silenciosamente no banco local seria perigoso. Falha na hora se faltar.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "❌ DATABASE_URL não definido. Defina a variável (do banco alvo) antes de rodar o seed de RBAC.",
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  // 1. Administrador — papel de sistema (superusuário). Mantém sincronizado.
  const adminRole = await prisma.role.upsert({
    where: { name: RBAC_ROLE_NAMES.admin },
    create: {
      name: RBAC_ROLE_NAMES.admin,
      description: "Acesso total ao sistema. Papel de sistema, não editável.",
      permissions: ALL_PERMISSIONS,
      isSystem: true,
    },
    update: { permissions: ALL_PERMISSIONS, isSystem: true },
  });
  console.log(`✅ Papel de sistema "${RBAC_ROLE_NAMES.admin}" garantido.`);

  // 2. Legado e Novo usuário — pontos de partida editáveis. Create-only:
  //    `update: {}` só garante a existência sem apagar ajustes do admin.
  const legacyRole = await prisma.role.upsert({
    where: { name: RBAC_ROLE_NAMES.legacy },
    create: {
      name: RBAC_ROLE_NAMES.legacy,
      description:
        "Todas as permissões, exceto administração. Atribuído às contas antigas.",
      permissions: FEATURE_PERMISSIONS,
      isSystem: false,
    },
    update: {},
  });
  console.log(`✅ Papel "${RBAC_ROLE_NAMES.legacy}" garantido.`);

  await prisma.role.upsert({
    where: { name: RBAC_ROLE_NAMES.newUser },
    create: {
      name: RBAC_ROLE_NAMES.newUser,
      description: "Somente leitura básica. Atribuído às contas novas.",
      permissions: NEW_USER_PERMISSIONS,
      isSystem: false,
    },
    update: {},
  });
  console.log(`✅ Papel "${RBAC_ROLE_NAMES.newUser}" garantido.`);

  // 3. Contas existentes sem papel → "Legado".
  const migrated = await prisma.user.updateMany({
    where: { roleId: null },
    data: { roleId: legacyRole.id },
  });
  console.log(
    `✅ ${migrated.count} conta(s) sem papel migrada(s) para "${RBAC_ROLE_NAMES.legacy}".`,
  );

  // 4. Bootstrap dos administradores via BOOTSTRAP_ADMIN_EMAIL.
  const raw = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  if (!raw) {
    console.log(
      "ℹ️  BOOTSTRAP_ADMIN_EMAIL não definido — nenhum admin foi promovido.",
    );
    return;
  }

  const emails = raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  for (const email of emails) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true },
    });

    if (!user) {
      console.warn(
        `⚠️  Usuário "${email}" não encontrado. Faça login no app ao menos uma vez e rode o seed novamente.`,
      );
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: adminRole.id },
    });
    console.log(`✅ ${user.email} agora é ${RBAC_ROLE_NAMES.admin}.`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Falha ao popular o RBAC:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
