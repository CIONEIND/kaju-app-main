import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { RBAC_ROLE_NAMES } from "@/lib/rbac/permissions";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as unknown as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      httpOptions: {
        timeout: 60000,
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  events: {
    /**
     * Toda conta nova nasce com o papel "Novo usuário" (só leitura básica) —
     * nunca com acesso total. Se o papel não existir (seed de RBAC ainda não
     * rodado), o usuário fica sem papel e cai no mesmo fallback de leitura
     * básica em `getCurrentUserAccess`.
     */
    async createUser({ user }) {
      try {
        const role = await prisma.role.findUnique({
          where: { name: RBAC_ROLE_NAMES.newUser },
          select: { id: true },
        });

        if (role) {
          await prisma.user.update({
            where: { id: user.id },
            data: { roleId: role.id },
          });
        } else {
          console.warn(
            `Papel "${RBAC_ROLE_NAMES.newUser}" não encontrado — usuário criado sem papel. Rode "npm run db:seed:rbac".`,
          );
        }
      } catch (error) {
        console.error("Falha ao atribuir papel padrão ao novo usuário:", error);
      }
    },
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { blocked: true },
      });

      return existingUser?.blocked !== true;
    },
    async session({ session, user }) {
      if (session.user) {
        const databaseUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { blocked: true },
        });

        session.user.id = user.id;
        session.user.blocked = databaseUser?.blocked ?? false;
      }

      return session;
    },
  },
};
