import type { Knex } from "knex";
import { topManager } from "../../db/knex-topManger";
import CioneF3PGI6Repository from "../../repository/cione-f3pgi6/cione-f3pgi6.repository";
import {
  salvarAnaliseF3PGI6Schema,
  type SalvarAnaliseF3PGI6SchemaType,
} from "./schemas";
import type {
  AnaliseF3PGI6,
  FiltroAnaliseF3PGI6,
} from "../../repository/cione-f3pgi6/types";

/**
 * DATAHORA é smalldatetime (sem fuso). Enviamos STRING para o driver não
 * converter para UTC e deslocar a hora em 3h.
 */
function toSqlDateTime(data: string, hora?: string): string {
  return `${data} ${hora ?? "00:00"}:00`;
}

export default class CioneF3PGI6Service {
  private db: Knex = topManager;

  async listar(
    filtro: FiltroAnaliseF3PGI6 = {},
    tsx: Knex = this.db,
  ): Promise<AnaliseF3PGI6[]> {
    return CioneF3PGI6Repository.listar(filtro, tsx);
  }

  async contar(
    filtro: FiltroAnaliseF3PGI6 = {},
    tsx: Knex = this.db,
  ): Promise<number> {
    return CioneF3PGI6Repository.contar(filtro, tsx);
  }

  async buscarPorId(
    id: number,
    tsx: Knex = this.db,
  ): Promise<AnaliseF3PGI6 | null> {
    return CioneF3PGI6Repository.buscarPorId(id, tsx);
  }

  async listarLotes(tsx: Knex = this.db) {
    return CioneF3PGI6Repository.listarLotes(tsx);
  }

  async listarTipos(tsx: Knex = this.db) {
    return CioneF3PGI6Repository.listarTipos(tsx);
  }

  private validar(dto: SalvarAnaliseF3PGI6SchemaType) {
    const validation = salvarAnaliseF3PGI6Schema.safeParse(dto);
    if (!validation.success) {
      throw new Error(
        validation.error.issues[0]?.message ?? "Dados inválidos.",
      );
    }
    return validation.data;
  }

  async criar(dto: SalvarAnaliseF3PGI6SchemaType, tsx: Knex = this.db) {
    const v = this.validar(dto);
    return CioneF3PGI6Repository.inserir(
      {
        DATAHORA: toSqlDateTime(v.data, v.hora) as unknown as Date,
        Responsavel: v.responsavelCdUsr,
        Lote: v.loteId,
        Tipo: v.tipoId,
        t1Amendoa: v.t1Amendoa ?? null,
        t2Amendoa: v.t2Amendoa ?? null,
        t3Amendoa: v.t3Amendoa ?? null,
        t1Casca: v.t1Casca ?? null,
        t2Casca: v.t2Casca ?? null,
        t3Casca: v.t3Casca ?? null,
      },
      tsx,
    );
  }

  async atualizar(
    id: number,
    dto: SalvarAnaliseF3PGI6SchemaType,
    tsx: Knex = this.db,
  ) {
    const v = this.validar(dto);
    const afetadas = await CioneF3PGI6Repository.atualizar(
      id,
      {
        DATAHORA: toSqlDateTime(v.data, v.hora) as unknown as Date,
        Responsavel: v.responsavelCdUsr,
        Lote: v.loteId,
        Tipo: v.tipoId,
        t1Amendoa: v.t1Amendoa ?? null,
        t2Amendoa: v.t2Amendoa ?? null,
        t3Amendoa: v.t3Amendoa ?? null,
        t1Casca: v.t1Casca ?? null,
        t2Casca: v.t2Casca ?? null,
        t3Casca: v.t3Casca ?? null,
      },
      tsx,
    );
    if (!afetadas) throw new Error("Análise não encontrada.");
    return afetadas;
  }
}