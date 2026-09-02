"use server";
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
  console.log(process.env.SQL_SERVER_DEV_HOST);
  return getTopManagerDB("DESE")("TbCli as cli")
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
}
