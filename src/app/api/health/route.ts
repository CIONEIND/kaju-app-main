import { prisma } from "@/lib/prisma";

// Route Handlers não são cacheados por padrão no Next 16, então não é preciso
// nenhuma config de segmento aqui. O pipeline usa esta rota como gate de deploy
// e o container usa como HEALTHCHECK — por isso ela toca o Postgres: se as
// migrations não rodaram ou a DATABASE_URL está errada, o deploy falha alto.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      status: "ok",
      commit: process.env.APP_COMMIT ?? null,
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 503 },
    );
  }
}
