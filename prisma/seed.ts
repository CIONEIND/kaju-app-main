/**
 * Popula as tabelas `UF` e `Municipio` a partir dos CSVs do IBGE na raiz do
 * repositório.
 *
 * Rode com:
 *   npm run db:seed
 *
 * Também é executado automaticamente pelo `npx prisma migrate dev` e pelo
 * `npx prisma migrate reset` (configurado em `prisma.config.ts`).
 *
 * O script é idempotente: usa `upsert`, então rodar várias vezes não duplica
 * nem quebra. Municípios que saíram dos CSVs não são removidos do banco.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const ROOT = join(import.meta.dirname, "..");

const UF_CSV = join(ROOT, "unidades-federativas.csv");
const MUNICIPIO_CSV = join(ROOT, "municipios.csv");

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/kaju";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type UfRow = { id: number; nome: string };
type MunicipioRow = { id: number; nome: string; ufId: number };

/**
 * Lê um CSV e devolve as linhas já divididas em colunas.
 *
 * Os dois arquivos são simples — sem aspas e sem o delimitador dentro dos
 * valores — então `split` basta e evita mais uma dependência. Se algum dia os
 * CSVs passarem a ter campos entre aspas, troque por um parser de verdade.
 */
function readCsv(
  path: string,
  {
    delimiter,
    encoding,
    hasHeader,
  }: {
    delimiter: string;
    encoding: "utf-8" | "latin1";
    hasHeader: boolean;
  },
): string[][] {
  const text = new TextDecoder(encoding).decode(readFileSync(path));

  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(delimiter).map((cell) => cell.trim()));

  return hasHeader ? rows.slice(1) : rows;
}

/**
 * `unidades-federativas.csv` está em ISO-8859-1 (não UTF-8), tem cabeçalho e é
 * separado por vírgula: `Código UF,Unidade da Federação,UF`.
 *
 * A terceira coluna é a sigla (RO, AC, ...), mas o model `UF` não tem campo
 * para ela — só `id` e `nome` —, então ela é descartada aqui.
 */
function parseUfs(): UfRow[] {
  const rows = readCsv(UF_CSV, {
    delimiter: ",",
    encoding: "latin1",
    hasHeader: true,
  });

  return rows.map(([codigo, nome], index) => {
    const id = Number.parseInt(codigo, 10);

    if (Number.isNaN(id)) {
      throw new Error(
        `unidades-federativas.csv: código inválido "${codigo}" na linha ${index + 2}`,
      );
    }

    return {
      id,
      // "Rio Grande do Sul (*)" — o CSV do IBGE traz um marcador de nota de
      // rodapé em algumas linhas.
      nome: nome.replace(/\s*\(\*+\)\s*$/, "").trim(),
    };
  });
}

/**
 * `municipios.csv` está em UTF-8, não tem cabeçalho e é separado por ponto e
 * vírgula: `códigoUF;códigoMunicípio;nome`.
 */
function parseMunicipios(validUfIds: Set<number>): MunicipioRow[] {
  const rows = readCsv(MUNICIPIO_CSV, {
    delimiter: ";",
    encoding: "utf-8",
    hasHeader: false,
  });

  return rows.map(([codigoUf, codigoMunicipio, nome], index) => {
    const ufId = Number.parseInt(codigoUf, 10);
    const id = Number.parseInt(codigoMunicipio, 10);

    if (Number.isNaN(id) || Number.isNaN(ufId)) {
      throw new Error(
        `municipios.csv: código inválido na linha ${index + 1}: "${codigoUf};${codigoMunicipio};${nome}"`,
      );
    }

    // Falha cedo: um município órfão só quebraria depois, como erro de chave
    // estrangeira, com uma mensagem bem menos clara.
    if (!validUfIds.has(ufId)) {
      throw new Error(
        `municipios.csv: linha ${index + 1} referencia a UF ${ufId}, que não existe em unidades-federativas.csv`,
      );
    }

    return { id, nome, ufId };
  });
}

async function main() {
  const ufs = parseUfs();
  const municipios = parseMunicipios(new Set(ufs.map((uf) => uf.id)));

  console.log(
    `Lidos ${ufs.length} UFs e ${municipios.length} municípios dos CSVs.`,
  );

  // As UFs vêm primeiro: `Municipio.ufId` tem chave estrangeira para `UF.id`.
  for (const uf of ufs) {
    await prisma.uF.upsert({
      where: { id: uf.id },
      create: uf,
      update: { nome: uf.nome },
    });
  }

  console.log(`✅ ${ufs.length} UFs inseridas/atualizadas.`);

  // Os municípios vão em lotes para não montar uma única transação gigante nem
  // abrir 5.570 round-trips sequenciais ao banco.
  const BATCH_SIZE = 500;

  for (let i = 0; i < municipios.length; i += BATCH_SIZE) {
    const batch = municipios.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(
      batch.map((municipio) =>
        prisma.municipio.upsert({
          where: { id: municipio.id },
          create: municipio,
          update: { nome: municipio.nome, ufId: municipio.ufId },
        }),
      ),
    );

    console.log(
      `   ${Math.min(i + BATCH_SIZE, municipios.length)}/${municipios.length} municípios...`,
    );
  }

  console.log(`✅ ${municipios.length} municípios inseridos/atualizados.`);
}

main()
  .catch((error) => {
    console.error("❌ Falha ao popular o banco:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
