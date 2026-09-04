/*"use server";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { getTopManagerDB } from "@/lib/top-manager/db/resolve-db";
// import { topManagerProducao } from "@/lib/top-manager/db/knex-top-manager-producao";
import type { ClienteMercadoDTO } from "./types";

// A lista de clientes só é usada no formulário de pedido (seleção do cliente) e
// dentro do próprio salvamento do pedido — por isso exige salvar pedido.
export async function getAllClients(): Promise<ClienteMercadoDTO[]> {
  await requirePermission(PERMISSIONS.ORDERS_SAVE);
  console.log("Retrieving all clients");
  console.log(process.env.SQLSERVER_PROD_HOST);
  return getTopManagerDB("PROD")("TbCli as cli")
    .innerJoin("TbPes as tp", "tp.CdPes", "cli.CdPes")
    .innerJoin("TbAve as ave", "ave.CdAve", "cli.CdAve")
    .select({
      codCliente: "cli.CdCli",
      nome: "cli.NmCli",
      cpfCnpj: "tp.NrPesCpj",
      codMercado: "ave.CdAve",
      descMercado: "ave.NmAve",
    })
    .where("cli.TpCliNiv", 4)
    // .whereNotNull("tp.NrPesCpj")
    .andWhere("cli.FlCliNaoAtv", 0)
    .orderBy("cli.NmCli", "asc");
}*/
"use server";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { topManagerProducao } from "@/lib/top-manager/db/knex-top-manager-producao";
import type { ClienteMercadoDTO } from "./types";

// A lista de clientes só é usada no formulário de pedido (seleção do cliente) e
// dentro do próprio salvamento do pedido — por isso exige salvar pedido.
export async function getAllClients(): Promise<ClienteMercadoDTO[]> {
  await requirePermission(PERMISSIONS.ORDERS_SAVE);

  const results = await topManagerProducao
    .select<Array<{
      codCliente: number;
      nome: string;
      cpfCnpj: string | null;
      codMercado: number;
      descMercado: string;
    }>>(
      "cli.CdCli as codCliente",
      "cli.NmCli as nome",
      "tp.NrPesCpj as cpfCnpj",
      "ave.CdAve as codMercado",
      "ave.NmAve as descMercado",
    )
    .from("TbCli as cli")
    .join("TbPes as tp", function () {
      this.on("tp.CdPes", "=", "cli.CdPes");
    })
    .join("TbAve as ave", function () {
      this.on("ave.CdAve", "=", "cli.CdAve");
    })
    .where("cli.TpCliNiv", 4)
    // .whereNotNull("tp.NrPesCpj")
    .andWhere("cli.FlCliNaoAtv", 0)
    .orderBy("cli.NmCli", "asc");

  return results.map((row) => ({
    codCliente: row.codCliente,
    nome: row.nome,
    cpfCnpj: row.cpfCnpj ?? "", 
    codMercado: row.codMercado,
    descMercado: row.descMercado,
  }));
}