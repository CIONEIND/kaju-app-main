import type { Knex } from "knex";
import { topManager } from "../../db/knex-topManger";
import CioneF6PGI6Repository from "../../repository/cione-f6pgi6/cione-f6pgi6.repository";
import {
  salvarAnaliseF6PGI6Schema,
  type SalvarAnaliseF6PGI6SchemaType,
} from "./schemas";
import type { FiltroAnaliseF6PGI6 } from "../../repository/cione-f6pgi6/types";

function toSqlDateTime(data: string, hora?: string): string {
  return `${data} ${hora ?? "00:00"}:00`;
}

export default class CioneF6PGI6Service {
  private db: Knex = topManager;

  listar(filtro: FiltroAnaliseF6PGI6 = {}, tsx: Knex = this.db) {
    return CioneF6PGI6Repository.listar(filtro, tsx);
  }

  contar(filtro: FiltroAnaliseF6PGI6 = {}, tsx: Knex = this.db) {
    return CioneF6PGI6Repository.contar(filtro, tsx);
  }

  buscarPorId(id: number, tsx: Knex = this.db) {
    return CioneF6PGI6Repository.buscarPorId(id, tsx);
  }

  resumo(filtro: FiltroAnaliseF6PGI6 = {}, tsx: Knex = this.db) {
    return CioneF6PGI6Repository.resumo(filtro, tsx);
  }

  listarLotes(tsx: Knex = this.db) {
    return CioneF6PGI6Repository.listarLotes(tsx);
  }

  listarTipos(tsx: Knex = this.db) {
    return CioneF6PGI6Repository.listarTipos(tsx);
  }

  listarSilos(tsx: Knex = this.db) {
    return CioneF6PGI6Repository.listarSilos(tsx);
  }

  private validar(dto: SalvarAnaliseF6PGI6SchemaType) {
    const v = salvarAnaliseF6PGI6Schema.safeParse(dto);
    if (!v.success) {
      throw new Error(v.error.issues[0]?.message ?? "Dados inválidos.");
    }
    return v.data;
  }
  private statusNum(s?: "rascunho" | "concluida"): number {
  return s === "rascunho" ? 0 : 1;
}

  async criar(dto: SalvarAnaliseF6PGI6SchemaType, tsx: Knex = this.db) {
    const v = this.validar(dto);
    return CioneF6PGI6Repository.inserir(
      {
        DATAHORA: toSqlDateTime(v.data, v.hora) as unknown as Date,
        Responsavel: v.responsavelCdUsr,
        Lote: v.loteId,
        Silo: v.siloId,
        Tipo: v.tipoId,
        Cubagem: v.cubagem ?? null,
        Consumo: v.consumo ?? null,
        Status: this.statusNum(v.status),
      },
      tsx,
    );
  }

  async atualizar(
    id: number,
    dto: SalvarAnaliseF6PGI6SchemaType,
    tsx: Knex = this.db,
  ) {
    const v = this.validar(dto);
    const afetadas = await CioneF6PGI6Repository.atualizar(
      id,
      {
        DATAHORA: toSqlDateTime(v.data, v.hora) as unknown as Date,
        Responsavel: v.responsavelCdUsr,
        Lote: v.loteId,
        Silo: v.siloId,
        Tipo: v.tipoId,
        Cubagem: v.cubagem ?? null,
        Consumo: v.consumo ?? null,
        Status: this.statusNum(v.status),
      },
      tsx,
    );
    if (!afetadas) throw new Error("Análise não encontrada.");
    return afetadas;
  }
}