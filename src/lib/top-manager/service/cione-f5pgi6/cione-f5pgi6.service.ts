import type { Knex } from "knex";
import { topManager } from "../../db/knex-topManger";
import CioneF5PGI6Repository from "../../repository/cione-f5pgi6/cione-f5pgi6.repository";
import {
  salvarAnaliseF5PGI6Schema,
  type SalvarAnaliseF5PGI6SchemaType,
} from "./schemas";
import type { FiltroAnaliseF5PGI6 } from "../../repository/cione-f5pgi6/types";

function toSqlDateTime(data: string, hora?: string): string {
  return `${data} ${hora ?? "00:00"}:00`;
}

/** Resultado de um salvamento */
export interface ResultadoSalvar {
  id: number;
}

export default class CioneF5PGI6Service {
  private db: Knex = topManager;

  listar(filtro: FiltroAnaliseF5PGI6 = {}, tsx: Knex = this.db) {
    return CioneF5PGI6Repository.listar(filtro, tsx);
  }

  contar(filtro: FiltroAnaliseF5PGI6 = {}, tsx: Knex = this.db) {
    return CioneF5PGI6Repository.contar(filtro, tsx);
  }

  buscarPorId(id: number, tsx: Knex = this.db) {
    return CioneF5PGI6Repository.buscarPorId(id, tsx);
  }

  listarLotes(tsx: Knex = this.db) {
    return CioneF5PGI6Repository.listarLotes(tsx);
  }

  listarTipos(tsx: Knex = this.db) {
    return CioneF5PGI6Repository.listarTipos(tsx);
  }

  listarSilos(tsx: Knex = this.db) {
    return CioneF5PGI6Repository.listarSilos(tsx);
  }

  listarOrigens(tsx: Knex = this.db) {
    return CioneF5PGI6Repository.listarOrigens(tsx);
  }

  private validar(dto: SalvarAnaliseF5PGI6SchemaType) {
    const v = salvarAnaliseF5PGI6Schema.safeParse(dto);
    if (!v.success) {
      throw new Error(v.error.issues[0]?.message ?? "Dados inválidos.");
    }
    return v.data;
  }

  /** 0 = rascunho · 1 = concluída */
  private statusNum(s?: "rascunho" | "concluida"): number {
    return s === "rascunho" ? 0 : 1;
  }

  private montarLinha(v: SalvarAnaliseF5PGI6SchemaType) {
    return {
      DATAHORA: toSqlDateTime(v.data, v.hora) as unknown as Date,
      Responsavel: v.responsavelCdUsr,
      Lote: v.loteId,
      Silo: v.siloId,
      Tipo: v.tipoId,
      Origem: v.origemId,
      t1Amendoa: v.t1Amendoa ?? null,
      t2Amendoa: v.t2Amendoa ?? null,
      t3Amendoa: v.t3Amendoa ?? null,
      t1Casca: v.t1Casca ?? null,
      t2Casca: v.t2Casca ?? null,
      t3Casca: v.t3Casca ?? null,
      Status: this.statusNum(v.status),
    };
  }

  async criar(
    dto: SalvarAnaliseF5PGI6SchemaType,
    tsx: Knex = this.db,
  ): Promise<ResultadoSalvar> {
    const v = this.validar(dto);
    const linha = this.montarLinha(v);
    const id = await CioneF5PGI6Repository.inserir(linha, tsx);
    return { id };
  }

  async atualizar(
    id: number,
    dto: SalvarAnaliseF5PGI6SchemaType,
    tsx: Knex = this.db,
  ): Promise<ResultadoSalvar> {
    const v = this.validar(dto);
    const linha = this.montarLinha(v);

    const afetadas = await CioneF5PGI6Repository.atualizar(id, linha, tsx);
    if (!afetadas) throw new Error("Análise não encontrada.");

    return { id };
  }

  async excluir(id: number, tsx: Knex = this.db): Promise<number> {
    return CioneF5PGI6Repository.excluir(id, tsx);
  }
}