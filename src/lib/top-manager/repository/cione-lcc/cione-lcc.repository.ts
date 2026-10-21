import type { Knex } from "knex";
import { topManager } from "../../db/knex-topManger";
import type {
  AnaliseLCC,
  CioneLCCRow,
} from "./types"; // ajuste para o caminho real do FiltroCentral ou redefina
import { FiltroCentral } from "@/lib/analises/tipos";

const TABELA = "CIONE_ResultadoLCCDiario";
const SCHEMA = "dbo";

/** CdObj das DIVISÕES MÃE de origem — CONFIRMAR os códigos */
const ORIGENS_CDOBJ_MAE = [52155];

/**
 * Fórmula oficial do resultado (litros corrigidos por temperatura).
 * Mantida em UMA constante: o card e o formulário usam a mesma conta.
 */
export const FORMULA_RESULTADO_SQL =
  "ISNULL(C.Altura * PI() * 2.25 * 1000 * (0.96 - ((C.Temperatura - 25) * 0.00069)), 0)";

function n(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}
function s(v: unknown): string | null {
  return v === null || v === undefined ? null : String(v);
}

function toAnalise(row: Record<string, unknown>): AnaliseLCC {
  return {
    id: row.ID as number,
    data: (row.Data as string) ?? "",
    hora: (row.Hora as string) ?? "",
    responsavelCdUsr: n(row.Responsavel),
    responsavelNome: s(row.ResponsavelNome),
    loteId: n(row.Lote),
    loteNome: s(row.LoteNome),
    origemId: n(row.Origem),
    origemNome: s(row.OrigemNome),
    viscosidade: n(row.Viscosidade),
    altura: n(row.Altura),
    temperatura: n(row.Temperatura),
    resultado: n(row.Resultado),
  };
}

export default class CioneLCCRepository {
  static db: Knex = topManager;
  static tableName = TABELA;

  static baseQuery(tsx: Knex = this.db) {
    return tsx
      .withSchema(SCHEMA)
      .from(`${TABELA} as C`)
      .leftJoin("TbObj as ObjOri", "ObjOri.CdObj", "C.Origem")
      .leftJoin("TbUsr as UsrResp", "UsrResp.CdUsr", "C.Responsavel")
      .leftJoin("CIONE_LotesSemanais as LS", "LS.Id", "C.Lote")
      .select(
        "C.ID",
        tsx.raw("CONVERT(varchar(10), C.DATAHORA, 120) as Data"),
        tsx.raw("CONVERT(varchar(5), C.DATAHORA, 108) as Hora"),
        "C.Responsavel",
        "C.Lote",
        "C.Origem",
        "C.Viscosidade",
        "C.Altura",
        "C.Temperatura",
        tsx.raw(`CONVERT(decimal(19,2), ${FORMULA_RESULTADO_SQL}) as Resultado`),
        "ObjOri.NmObj as OrigemNome",
        "UsrResp.NmUsr as ResponsavelNome",
        "LS.NomeLote as LoteNome",
      );
  }

  private static aplicarFiltros(
    q: Knex.QueryBuilder,
    filtro: FiltroCentral,
  ) {
    if (filtro.dtInicial) {
      q.whereRaw("CAST(C.DATAHORA AS date) >= ?", [filtro.dtInicial]);
    }
    if (filtro.dtFinal) {
      q.whereRaw("CAST(C.DATAHORA AS date) <= ?", [filtro.dtFinal]);
    }
    if (filtro.loteId !== undefined) q.where("C.Lote", filtro.loteId);
    if (filtro.origemId !== undefined) q.where("C.Origem", filtro.origemId);
  }

  static async listar(
    filtro: FiltroCentral = {},
    tsx: Knex = this.db,
  ): Promise<AnaliseLCC[]> {
    const q = this.baseQuery(tsx);
    this.aplicarFiltros(q, filtro);
    q.orderBy("C.DATAHORA", "desc").orderBy("C.ID", "desc");
    if (filtro.limite) q.limit(filtro.limite);
    if (filtro.offset) q.offset(filtro.offset);
    const rows = await q;
    return rows.map(toAnalise);
  }

  static async contar(filtro: FiltroCentral = {}, tsx: Knex = this.db) {
    const q = tsx.withSchema(SCHEMA).from(`${TABELA} as C`);
    this.aplicarFiltros(q, filtro);
    const rows = await q.count({ total: "*" });
    return Number(rows[0]?.total ?? 0);
  }

  static async buscarPorId(id: number, tsx: Knex = this.db) {
    const row = await this.baseQuery(tsx).where("C.ID", id).first();
    return row ? toAnalise(row) : null;
  }

  /** SUBSTITUI a linha "RESUMO GERAL L1 e L2" da query original */
  static async resumo(filtro: FiltroCentral = {}, tsx: Knex = this.db) {
    const q = tsx
      .withSchema(SCHEMA)
      .from(`${TABELA} as C`)
      .select(
        tsx.raw(`SUM(${FORMULA_RESULTADO_SQL}) as Total`),
        tsx.raw("COUNT(*) as Quantidade"),
      );
    this.aplicarFiltros(q, filtro);
    const rows = await q;
    const r = (rows[0] ?? {}) as Record<string, unknown>;
    return { total: Number(r.Total ?? 0), quantidade: Number(r.Quantidade ?? 0) };
  }

  static async inserir(
    dados: Omit<CioneLCCRow, "ID">,
    tsx: Knex = this.db,
  ): Promise<number> {
    const query = tsx.withSchema(SCHEMA).table(TABELA).insert(dados).toSQL();
    const result = await tsx.raw(
      `${query.sql};\nSELECT CAST(SCOPE_IDENTITY() AS INT) AS ID;`,
      query.bindings,
    );
    return result[0].ID;
  }

  static async atualizar(
    id: number,
    dados: Omit<CioneLCCRow, "ID">,
    tsx: Knex = this.db,
  ): Promise<number> {
    return tsx.withSchema(SCHEMA).table(TABELA).where("ID", id).update(dados);
  }

  /** Catálogos */
  static async listarLotes(tsx: Knex = this.db) {
    const rows = await tsx
      .withSchema(SCHEMA)
      .table("CIONE_LotesSemanais")
      .select("Id as id", "NomeLote as nome")
      .orderBy("NomeLote", "asc");
    return rows.map((r: { id: number; nome: string | null }) => ({
      id: r.id,
      nome: r.nome ?? `Lote ${r.id}`,
    }));
  }

  /** Origens via divisão mãe — mesma adaptação que você fez para os silos */
  static async listarOrigens(tsx: Knex = this.db) {
    const rows = await tsx
      .withSchema(SCHEMA)
      .table("TbObj")
      .select("CdObj as cdObj", "NmObj as nome")
      .whereIn("CdObjMae", ORIGENS_CDOBJ_MAE)
      .orderBy("NmObj", "asc");
    return rows.map((r: { cdObj: number; nome: string | null }) => ({
      cdObj: r.cdObj,
      nome: r.nome ?? `Origem ${r.cdObj}`,
    }));
  }
}