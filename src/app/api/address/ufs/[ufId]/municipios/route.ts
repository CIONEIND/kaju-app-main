import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. Define an interface for clarity (Optional but recommended)
interface RouteParams {
  params: Promise<{ ufId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams // 2. Update the type here to accept the Promise
) {
  try {
    // This is correct for Next.js 15!
    const { ufId } = await params;

    console.log("RECEEEEIVED ", ufId);

    if (isNaN(Number(ufId))) {
      return NextResponse.json({ error: "ID do estado inválido." }, { status: 400 });
    }

    const municipios = await prisma.municipio.findMany({
      where: { ufId: Number(ufId) },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(municipios);
  } catch (error) {
    // Using the destructive assignment variable since params cannot be read synchronously here anymore
    console.error(`Erro ao buscar municípios.`);
    return NextResponse.json(
      { error: "Não foi possível carregar as cidades." },
      { status: 500 }
    );
  }
}