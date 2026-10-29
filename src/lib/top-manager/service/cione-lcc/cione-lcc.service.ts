import type { Knex } from "knex";
import { topManager } from "../../db/knex-topManger";
import CioneLCCRepository from "../../repository/cione-lcc/cione-lcc.repository";
import {
  salvarAnaliseLCCSchema,
  type SalvarAnaliseLCCSchemaType,
} from "./schemas";
import type { FiltroCentral } from "@/lib/analises/tipos";

function toSqlDateTime(data: string, hora?: string): string {
  return `${data} ${hora ?? "00:00"}:00`;
}

export default class CioneLCCService {
  private db: Knex = topManager;

  listar(filtro: FiltroCentral = {}, tsx: Knex = this.db) {
    return CioneLCCRepository.listar(filtro, tsx);
  }
  contar(filtro: FiltroCentral = {}, tsx: Knex = this.db) {
    return CioneLCCRepository.contar(filtro, tsx);
  }
  buscarPorId(id: number, tsx: Knex = this.db) {
    return CioneLCCRepository.buscarPorId(id, tsx);
  }
  resumo(filtro: FiltroCentral = {}, tsx: Knex = this.db) {
    return CioneLCCRepository.resumo(filtro, tsx);
  }
  listarLotes(tsx: Knex = this.db) {
    return CioneLCCRepository.listarLotes(tsx);
  }
  listarOrigens(tsx: Knex = this.db) {
    return CioneLCCRepository.listarOrigens(tsx);
  }

  private validar(dto: SalvarAnaliseLCCSchemaType) {
    const v = salvarAnaliseLCCSchema.safeParse(dto);
    if (!v.success) throw new Error(v.error.issues[0]?.message ?? "Dados inválidos.");
    return v.data;
  }
  private statusNum(s?: "rascunho" | "concluida"): number {
    return s === "rascunho" ? 0 : 1;
  }
  /**
   * ATENÇÃO: Resultado NÃO é gravado — é derivado de Altura e Temperatura.
   * Só os três insumos vão para o banco.
   */
  async criar(dto: SalvarAnaliseLCCSchemaType, tsx: Knex = this.db) {
    const v = this.validar(dto);
    return CioneLCCRepository.inserir(
      {
        DATAHORA: toSqlDateTime(v.data, v.hora) as unknown as Date,
        Responsavel: v.responsavelCdUsr,
        Lote: v.loteId,
        Origem: v.origemId,
        Viscosidade: v.viscosidade ?? null,
        Altura: v.altura ?? null,
        Temperatura: v.temperatura ?? null,
        Status: this.statusNum(v.status),
      },
      tsx,
    );
  }

  async atualizar(
    id: number,
    dto: SalvarAnaliseLCCSchemaType,
    tsx: Knex = this.db,
  ) {
    const v = this.validar(dto);
    const afetadas = await CioneLCCRepository.atualizar(
      id,
      {
        DATAHORA: toSqlDateTime(v.data, v.hora) as unknown as Date,
        Responsavel: v.responsavelCdUsr,
        Lote: v.loteId,
        Origem: v.origemId,
        Viscosidade: v.viscosidade ?? null,
        Altura: v.altura ?? null,
        Temperatura: v.temperatura ?? null,
        Status: this.statusNum(v.status),
      },
      tsx,
    );
    if (!afetadas) throw new Error("Análise não encontrada.");
    return afetadas;
  }
}