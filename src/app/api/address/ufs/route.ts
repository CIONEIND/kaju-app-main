import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust path to your Prisma client

export async function GET() {
  try {
    const ufs = await prisma.uF.findMany({
      orderBy: { nome: "asc" },
    });
    
    return NextResponse.json(ufs);
  } catch (error) {
    console.error("Erro ao buscar UFs:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os estados." },
      { status: 500 }
    );
  }
}