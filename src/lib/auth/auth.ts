// src/lib/auth.ts
import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth"; // ADAPTAR: aponte para onde o authOptions vive (src/auth.ts)
import { prisma } from "@/lib/prisma";

export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  role: string | null;
  cdUsrTopManager: number | null;
}

export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      blocked: true,
      cdUsrTopManager: true,
      role: { select: { name: true } },
    },
  });

  if (!user || user.blocked) return null;

  return {
    id: user.id,
    nome: user.name ?? user.email ?? "",
    email: user.email ?? "",
    role: user.role?.name ?? null,
    cdUsrTopManager: user.cdUsrTopManager,
  };
}