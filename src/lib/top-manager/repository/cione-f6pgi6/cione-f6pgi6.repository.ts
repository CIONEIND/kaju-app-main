import type { Knex } from "knex";
import { topManager } from "../../db/knex-topManger";
import type {
  AnaliseF6PGI6,
  CioneF6PGI6Row,
  FiltroAnaliseF6PGI6,
  ResumoF6PGI6,
} from "./types";

const TABELA = "CIONE_F6PGI6";
const SCHEMA = "dbo";

/** CdObj de Tipo (mesma família usada na F3PGI6) */
const TIPOS_CDOBJ = [52913, 52914, 52916, 52917, 53089, 53093, 53097];

/** CdObj de Silo — CONFIRMAR estes códigos no TbObj */
const SILOS_CDOBJ = [53115];

function n(valor: unknown): number | null {
  return valor === null || valor === undefined ? null : Number(valor);
}

function s(valor: unknown): string | null {
  return valor === null || valor === undefined ? null : String(valor);
}

function toAnalise(row: Record<string, unknown>): AnaliseF6PGI6 {
  return {
    id: row.ID as number,
    data: (row.Data as string) ?? "",
    hora: (row.Hora as string) ?? "",
    responsavelCdUsr: n(row.Responsavel),
    responsavelNome: s(row.ResponsavelNome),
    loteId: n(row.Lote),
    loteNome: s(row.LoteNome),
    siloId: n(row.Silo),
    siloNome: s(row.SiloNome),
    tipoId: n(row.Tipo),
    tipoNome: s(row.TipoNome),
    cubagem: n(row.Cubagem),
    consumo: n(row.Consumo),
  };
}

export default class CioneF6PGI6Repository {
  static db: Knex = topManager;
  static tableName = TABELA;

  /** Sem prefixo "dbo." nos joins — o withSchema já aplica */
  static baseQuery(tsx: Knex = this.db) {
    return tsx
      .withSchema(SCHEMA)
      .from(`${TABELA} as C`)
      .leftJoin("TbObj as ObjTp", "ObjTp.CdObj", "C.Tipo")
      .leftJoin("TbObj as ObjSil", "ObjSil.CdObj", "C.Silo")
      .leftJoin("TbUsr as UsrResp", "UsrResp.CdUsr", "C.Responsavel")
      .leftJoin("CIONE_LotesSemanais as LS", "LS.Id", "C.Lote")
      .select(
        "C.ID",
        tsx.raw("CONVERT(varchar(10), C.DATAHORA, 120) as Data"),
        tsx.raw("CONVERT(varchar(5), C.DATAHORA, 108) as Hora"),
        "C.Responsavel",
        "C.Lote",
        "C.Silo",
        "C.Tipo",
        "C.Cubagem",
        "C.Consumo",
        "ObjTp.NmObj as TipoNome",
        "ObjSil.NmObj as SiloNome",
        "UsrResp.NmUsr as ResponsavelNome",
        "LS.NomeLote as LoteNome",
      );
  }

  private static aplicarFiltros(
    q: Knex.QueryBuilder,
    filtro: FiltroAnaliseF6PGI6,
  ) {
    if (filtro.dtInicial) {
      q.whereRaw("CAST(C.DATAHORA AS date) >= ?", [filtro.dtInicial]);
    }
    if (filtro.dtFinal) {
      q.whereRaw("CAST(C.DATAHORA AS date) <= ?", [filtro.dtFinal]);
    }
    if (filtro.loteId !== undefined) q.where("C.Lote", filtro.loteId);
    if (filtro.tipoId !== undefined) q.where("C.Tipo", filtro.tipoId);
    if (filtro.siloId !== undefined) q.where("C.Silo", filtro.siloId);
  }

  static async listar(
    filtro: FiltroAnaliseF6PGI6 = {},
    tsx: Knex = this.db,
  ): Promise<AnaliseF6PGI6[]> {
    const q = this.baseQuery(tsx);
    this.aplicarFiltros(q, filtro);
    q.orderBy("C.DATAHORA", "desc").orderBy("C.ID", "desc");
    if (filtro.limite) q.limit(filtro.limite);
    if (filtro.offset) q.offset(filtro.offset);
    const rows = await q;
    return rows.map(toAnalise);
  }

  static async contar(
    filtro: FiltroAnaliseF6PGI6 = {},
    tsx: Knex = this.db,
  ): Promise<number> {
    const q = tsx.withSchema(SCHEMA).from(`${TABELA} as C`);
    this.aplicarFiltros(q, filtro);
    const rows = await q.count({ total: "*" });
    return Number(rows[0]?.total ?? 0);
  }

  static async buscarPorId(
    id: number,
    tsx: Knex = this.db,
  ): Promise<AnaliseF6PGI6 | null> {
    const row = await this.baseQuery(tsx).where("C.ID", id).first();
    return row ? toAnalise(row) : null;
  }

  /** Equivalente ao UNION de RESUMO da query: SUM(Consumo) por Tipo + Lote */
  static async resumo(
    filtro: FiltroAnaliseF6PGI6 = {},
    tsx: Knex = this.db,
  ): Promise<ResumoF6PGI6[]> {
    const q = tsx
      .withSchema(SCHEMA)
      .from(`${TABELA} as C`)
      .leftJoin("TbObj as ObjTp", "ObjTp.CdObj", "C.Tipo")
      .leftJoin("TbObj as ObjSil", "ObjSil.CdObj", "C.Silo")
      .leftJoin("CIONE_LotesSemanais as LS", "LS.Id", "C.Lote")
      .groupBy("ObjTp.NmObj", "ObjTp.CdObj", "LS.NomeLote", "LS.Id")
      .select(
        "ObjTp.CdObj as TipoId",
        "ObjTp.NmObj as TipoNome",
        "LS.Id as LoteId",
        "LS.NomeLote as LoteNome",
        tsx.raw("SUM(CONVERT(decimal(19,2), C.Consumo)) as ConsumoTotal"),
        tsx.raw("COUNT(ObjSil.CdObj) as QtdSilos"),
      )
      .orderBy("ConsumoTotal", "desc");

    this.aplicarFiltros(q, filtro);

    const rows = await q;
    return (rows as Record<string, unknown>[]).map((r) => ({
      tipoId: n(r.TipoId),
      tipoNome: s(r.TipoNome),
      loteId: n(r.LoteId),
      loteNome: s(r.LoteNome),
      consumototal: Number(r.ConsumoTotal ?? 0),
      qtdSilos: Number(r.QtdSilos ?? 0),
    }));
  }

  static async inserir(
    dados: Omit<CioneF6PGI6Row, "ID">,
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
    dados: Omit<CioneF6PGI6Row, "ID">,
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

  static async listarPorCdObj(cdObjs: number[], tsx: Knex = this.db) {
    const rows = await tsx
      .withSchema(SCHEMA)
      .table("TbObj")
      .select("CdObj as cdObj", "NmObj as nome")
      .whereIn("CdObj", cdObjs)
      .orderBy("NmObj", "asc");
    return rows.map((r: { cdObj: number; nome: string | null }) => ({
      cdObj: r.cdObj,
      nome: r.nome ?? `Obj ${r.cdObj}`,
    }));
  }
  static async listarPorCdObjMae(cdObjs: number[], tsx: Knex = this.db) {
    const rows = await tsx
      .withSchema(SCHEMA)
      .table("TbObj")
      .select("CdObj as cdObj", "NmObj as nome")
      .whereIn("CdObjMae", cdObjs)
      .orderBy("NmObj", "asc");
    return rows.map((r: { cdObj: number; nome: string | null }) => ({
      cdObj: r.cdObj,
      nome: r.nome ?? `Obj ${r.cdObj}`,
    }));
  }

  static async listarTipos(tsx: Knex = this.db) {
    return this.listarPorCdObj(TIPOS_CDOBJ, tsx);
  }

  static async listarSilos(tsx: Knex = this.db) {
    return this.listarPorCdObjMae(SILOS_CDOBJ, tsx);
  }
}