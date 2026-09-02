import type { Knex } from "knex";
import { getTopManagerDB } from "../../db/resolve-db";
import type {
  Cliente,
  ClienteConsultaFilters,
  ClienteConsultaPage,
  ClienteDetalhe,
  ClienteUpdateInput,
} from "./type";
import { TipoLocalidade } from "../localidade/types";

const db: Knex = getTopManagerDB("DESE");
const tableName = "TbCli";

async function findMaxNrCliOrd003(tsx: Knex = db) {
  const result = await tsx.raw(`
        SELECT COALESCE(MAX(NrCliOrd003), 0) as NrCliOrd003
        FROM TbCli WITH (UPDLOCK, HOLDLOCK)
    `);

  return result[0]?.NrCliOrd003;
}

async function save(obj: Cliente, tsx: Knex = db) {
  const query = tsx.table(tableName).insert(obj).toSQL();

  const result = await tsx.raw(
    `
        ${query.sql};
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS CdCli;
    `,
    query.bindings,
  );

  return result[0]?.CdCli;
}

async function findPaged(
  filters: ClienteConsultaFilters,
  tsx: Knex = db,
): Promise<ClienteConsultaPage> {
  const searchTerm = filters.search.trim();
  const numericSearch = searchTerm.replace(/\D/g, "");

  const baseQuery = tsx("TbCli as cli")
    .innerJoin("TbPes as pes", "pes.CdPes", "cli.CdPes")
    .where("cli.TpCliNiv", 4)
    .where("cli.FlCliNaoAtv", 0)
    // .whereNotNull("pes.NrPesCpj"); // clientes do merc. exerno não possuem cnpj
  // .orderBy("cli.NmCli", "asc");

  if (searchTerm) {
    baseQuery.andWhere((builder) => {
      builder.whereRaw("LOWER(cli.NmCli) LIKE ?", [
        `%${searchTerm.toLowerCase()}%`,
      ]);

      if (numericSearch) {
        builder.orWhereRaw("CAST(pes.NrPesCpj AS VARCHAR(20)) LIKE ?", [
          `%${numericSearch}%`,
        ]);
      }
    });
  }

  const totalRow = (await baseQuery
    .clone()
    .countDistinct({ total: "cli.CdCli" })
    .first()) as { total?: string | number } | undefined;

  const totalItems = Number(totalRow?.total ?? 0);
  const totalPages =
    totalItems > 0 ? Math.ceil(totalItems / filters.pageSize) : 0;
  const currentPage = totalPages > 0 ? Math.min(filters.page, totalPages) : 1;
  const offset = (currentPage - 1) * filters.pageSize;

  const items =
    totalItems === 0
      ? []
      : await baseQuery
          .clone()
          .select(
            "cli.CdCli as codCliente",
            "cli.NmCli as nome",
            tsx.raw("CAST(pes.NrPesCpj AS VARCHAR(20)) AS cpfCnpj"),
          )
          .orderBy("cli.NmCli", "asc")
          //   .orderBy("cli.CdCli", "asc")
          .offset(offset)
          .limit(filters.pageSize);

  return {
    items,
    page: currentPage,
    pageSize: filters.pageSize,
    totalItems,
    totalPages,
  };
}

async function findById(
  cdCli: number,
  tsx: Knex = db,
): Promise<ClienteDetalhe | null> {
  const customer = await tsx("TbCli as cli")
    .innerJoin("TbPes as pes", "pes.CdPes", "cli.CdPes")
    .leftJoin("TbLgr as lgr", "lgr.CdLgr", "pes.CdLgr")
    .leftJoin("TbLoc as loc0", "loc0.CdLoc", "pes.CdLoc")
    .leftJoin("TbLoc as loc1", "loc1.CdLoc", "loc0.CdLocMae")
    .leftJoin("TbLoc as loc2", "loc2.CdLoc", "loc1.CdLocMae")
    .leftJoin("TbLoc as loc3", "loc3.CdLoc", "loc2.CdLocMae")
    .leftJoin("TbLoc as loc4", "loc4.CdLoc", "loc3.CdLocMae")
    .where("cli.CdCli", cdCli)
    .first(
      "cli.CdCli as codCliente",
      "pes.CdPes as codPessoa",
      "cli.NmCli as nomePessoa",
      tsx.raw("CAST(pes.NrPesCpj AS VARCHAR(20)) AS cpfCnpj"),
      tsx.raw("COALESCE(CAST(pes.NrPesCgf AS VARCHAR(50)), '') AS rg"),
      tsx.raw("CAST(pes.TipoDePessoa AS VARCHAR(10)) AS tipoPessoa"),
      tsx.raw("CAST(cli.CdAve AS VARCHAR(10)) AS cdAve"),
      tsx.raw("CAST(cli.CdInf AS VARCHAR(10)) AS cdInf"),
      tsx.raw("loc0.NrLocNiv as loc0NrLocNiv"),
      tsx.raw("loc0.NmLoc as loc0NmLoc"),
      tsx.raw("loc0.SgLoc as loc0SgLoc"),
      tsx.raw("loc1.NrLocNiv as loc1NrLocNiv"),
      tsx.raw("loc1.NmLoc as loc1NmLoc"),
      tsx.raw("loc1.SgLoc as loc1SgLoc"),
      tsx.raw("loc2.NrLocNiv as loc2NrLocNiv"),
      tsx.raw("loc2.NmLoc as loc2NmLoc"),
      tsx.raw("loc2.SgLoc as loc2SgLoc"),
      tsx.raw("loc3.NrLocNiv as loc3NrLocNiv"),
      tsx.raw("loc3.NmLoc as loc3NmLoc"),
      tsx.raw("loc3.SgLoc as loc3SgLoc"),
      tsx.raw("loc4.NrLocNiv as loc4NrLocNiv"),
      tsx.raw("loc4.NmLoc as loc4NmLoc"),
      tsx.raw("loc4.SgLoc as loc4SgLoc"),
      // tsx.raw(
      //   "CASE WHEN LOWER(COALESCE(pais.NmLoc, '')) = 'brasil' THEN 1 ELSE 0 END AS isBrazil",
      // ),
      // tsx.raw("COALESCE(pais.NmLoc, '') AS country"),
      tsx.raw(
        "COALESCE(CAST(pes.NrPesEdrCep AS VARCHAR(20)), '') AS postalCode",
      ),
      tsx.raw("COALESCE(lgr.NmLgr, '') AS street"),
      tsx.raw(
        "COALESCE(CAST(pes.NrPesEdr AS VARCHAR(20)), '') AS streetNumber",
      ),
      // tsx.raw("COALESCE(bairro.NmLoc, '') AS neighborhood"),
      // tsx.raw("COALESCE(cidade.NmLoc, '') AS city"),
      // tsx.raw("COALESCE(estado.SgLoc, estado.NmLoc, '') AS state"),
      tsx.raw(" COALESCE(pes.NrPesEdrCom, '') AS complement"),
    );


  console.log({ customer });

  if (!customer) {
    return null;
  }

  const customerAddressLocs: {nivel: number, nome: string, sigla: string}[] = [
    { nivel: customer.loc0NrLocNiv, nome: customer.loc0NmLoc, sigla: customer.loc0SgLoc },
    { nivel: customer.loc1NrLocNiv, nome: customer.loc1NmLoc, sigla: customer.loc1SgLoc },
    { nivel: customer.loc2NrLocNiv, nome: customer.loc2NmLoc, sigla: customer.loc2SgLoc },
    { nivel: customer.loc3NrLocNiv, nome: customer.loc3NmLoc, sigla: customer.loc3SgLoc },
    { nivel: customer.loc4NrLocNiv, nome: customer.loc4NmLoc, sigla: customer.loc4SgLoc }
  ];

  const response =  {
    ...customer,
    tipoPessoa: String(customer.tipoPessoa ?? "1") as "1" | "2",
    cdAve: String(customer.cdAve ?? "84") as "84" | "85",
    cdInf: String(customer.cdInf ?? "1") as "1" | "5" | "6",
    neighborhood: customerAddressLocs.find(loc => loc.nivel === TipoLocalidade.BAIRRO)?.nome,
    city:  customerAddressLocs.find(loc => loc.nivel === TipoLocalidade.CIDADE)?.nome,
    country:  customerAddressLocs.find(loc => loc.nivel === TipoLocalidade.PAIS)?.nome,
  };

  response.isBrazil = response.country && response.country === "Brasil";
  response.state = response.isBrazil ? customerAddressLocs.find(loc => loc.nivel === TipoLocalidade.ESTADO)?.sigla : customerAddressLocs.find(loc => loc.nivel === TipoLocalidade.ESTADO)?.nome;

  return response;
}

async function updateById(
  cdCli: number,
  input: ClienteUpdateInput,
  tsx: Knex = db,
) {
  const current = await tsx("TbCli as cli")
    .innerJoin("TbPes as pes", "pes.CdPes", "cli.CdPes")
    .where("cli.CdCli", cdCli)
    .first("pes.CdPes as codPessoa");

  if (!current) {
    throw new Error("Cliente não encontrado.");
  }

  await tsx("TbPes")
    .where("CdPes", current.codPessoa)
    .update({
      NmPes: input.nomePessoa,
      NrPesCpj: Number(input.cpfCnpj),
      NrPesCgf: input.rg || null,
      TipoDePessoa: Number(input.tipoPessoa),
      CdLlg: input.cdLlg,
      CdLgr: input.cdLgr,
      CdLoc: input.cdLoc,
      NrPesEdr: input.numLogradouro,
      NrPesEdrCep: input.cep || null,
      CdAve: Number(input.cdAve),
    });

  await tsx(tableName)
    .where("CdCli", cdCli)
    .update({
      NmCli: input.nomePessoa,
      CdAve: Number(input.cdAve),
      CdInf: Number(input.cdInf),
    });
}

async function deactivateById(cdCli: number, tsx: Knex = db) {
  return tsx(tableName).where("CdCli", cdCli).update({
    FlCliNaoAtv: 1,
  });
}

const ClienteRepository = {
  db,
  tableName,
  findMaxNrCliOrd003,
  save,
  findPaged,
  findById,
  updateById,
  deactivateById,
};

export default ClienteRepository;
