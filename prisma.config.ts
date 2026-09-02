import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Prisma 7: o comando de seed vive aqui. O bloco `"prisma": { "seed": ... }`
    // do package.json, usado até a v6, foi removido e é ignorado.
    // `tsx` em vez de `node` porque o Prisma Client gerado usa imports sem
    // extensão (`./enums`), que o resolvedor ESM nativo do Node não aceita.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
