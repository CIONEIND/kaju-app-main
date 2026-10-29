import type { Knex } from "knex";
import { topManager } from "../../db/knex-topManger";
import type {
  AnaliseF3PGI6,
  CioneF3PGI6Row,
  FiltroAnaliseF3PGI6,
  LoteSemanalOpcao,
  TipoObjetoOpcao,
} from "./types";
import { aplicarStatus } from "../filtro/analises-filtro";

const TABELA = "CIONE_F3PGI6";
const SCHEMA = "dbo";

function media(
  a: number | null,
  b: number | null,
  c: number | null,
): number | null {
  if (a === null || b === null || c === null) return null;
  return Math.round(((a + b + c) / 3) * 100) / 100;
}

function toAnalise(row: Record<string, unknown>): AnaliseF3PGI6 {
  const t1A = (row.t1Amendoa as number | null) ?? null;
  const t2A = (row.t2Amendoa as number | null) ?? null;
  const t3A = (row.t3Amendoa as number | null) ?? null;
  const t1C = (row.t1Casca as number | null) ?? null;
  const t2C = (row.t2Casca as number | null) ?? null;
  const t3C = (row.t3Casca as number | null) ?? null;

  return {
    id: row.ID as number,
    data: (row.Data as string) ?? "",
    hora: (row.Hora as string) ?? "",
    responsavelCdUsr: (row.Responsavel as number | null) ?? null,
    responsavelNome: (row.ResponsavelNome as string | null) ?? null,
    status: Number(row.Status ?? 1),
    loteId: (row.Lote as number | null) ?? null,
    loteNome: (row.LoteNome as string | null) ?? null,
    tipoId: (row.Tipo as number | null) ?? null,
    tipoNome: (row.TipoNome as string | null) ?? null,
    t1Amendoa: t1A,
    t2Amendoa: t2A,
    t3Amendoa: t3A,
    t1Casca: t1C,
    t2Casca: t2C,
    t3Casca: t3C,
    mediaAmendoa: media(t1A, t2A, t3A),
    mediaCasca: media(t1C, t2C, t3C),
  };
}

export default class CioneF3PGI6Repository {
  static db: Knex = topManager;
  static tableName = TABELA;

  /** Uma linha por análise, com nomes resolvidos e data/hora como TEXTO */
  static baseQuery(tsx: Knex = this.db) {
    return tsx
      .withSchema(SCHEMA)
      .from(`${TABELA} as C`)
      .leftJoin("TbObj as ObjTp", "ObjTp.CdObj", "C.Tipo")
      .leftJoin("TbUsr as UsrResp", "UsrResp.CdUsr", "C.Responsavel")
      .leftJoin("CIONE_LotesSemanais as LS", "LS.Id", "C.Lote")
      .select(
        "C.ID",
        tsx.raw("CONVERT(varchar(10), C.DATAHORA, 120) as Data"),
        tsx.raw("CONVERT(varchar(5), C.DATAHORA, 108) as Hora"),
        "C.Responsavel",
        "C.Lote",
        "C.Tipo",
        "C.t1Amendoa",
        "C.t2Amendoa",
        "C.t3Amendoa",
        "C.t1Casca",
        "C.t2Casca",
        "C.t3Casca",
        "C.Status",
        "ObjTp.NmObj as TipoNome",
        "UsrResp.NmUsr as ResponsavelNome",
        "LS.NomeLote as LoteNome",
      );
  }

  private static aplicarFiltros(
    q: Knex.QueryBuilder,
    filtro: FiltroAnaliseF3PGI6,
  ) {
    if (filtro.dtInicial) {
      q.whereRaw("CAST(C.DATAHORA AS date) >= ?", [filtro.dtInicial]);
    }
    if (filtro.dtFinal) {
      q.whereRaw("CAST(C.DATAHORA AS date) <= ?", [filtro.dtFinal]);
    }
    if (filtro.loteId !== undefined) q.where("C.Lote", filtro.loteId);
    if (filtro.tipoId !== undefined) q.where("C.Tipo", filtro.tipoId);
    if (filtro.responsavelCdUsr !== undefined) {
      q.where("C.Responsavel", filtro.responsavelCdUsr);
    }
    aplicarStatus(q, filtro);
  }

  static async listar(
    filtro: FiltroAnaliseF3PGI6 = {},
    tsx: Knex = this.db,
  ): Promise<AnaliseF3PGI6[]> {
    const q = this.baseQuery(tsx);
    this.aplicarFiltros(q, filtro);
    q.orderBy("C.DATAHORA", "desc").orderBy("C.ID", "desc");
    if (filtro.limite) q.limit(filtro.limite);
    if (filtro.offset) q.offset(filtro.offset);

    const rows = await q;
    return rows.map(toAnalise);
  }

  static async contar(
    filtro: FiltroAnaliseF3PGI6 = {},
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
  ): Promise<AnaliseF3PGI6 | null> {
    const row = await this.baseQuery(tsx).where("C.ID", id).first();
    return row ? toAnalise(row) : null;
  }

  /** INSERT com recuperação do IDENTITY (padrão do PessoaRepository) */
  static async inserir(
    dados: Omit<CioneF3PGI6Row, "ID">,
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
    dados: Omit<CioneF3PGI6Row, "ID">,
    tsx: Knex = this.db,
  ): Promise<number> {
    return tsx.withSchema(SCHEMA).table(TABELA).where("ID", id).update(dados);
  }

  static async excluir(id: number, tsx: Knex = this.db): Promise<number> {
    return tsx.withSchema(SCHEMA).table(TABELA).where("ID", id).del();
  }

  // ─── Catálogos de apoio ─────────────────────────────────────────────────
  static async listarLotes(tsx: Knex = this.db): Promise<LoteSemanalOpcao[]> {
    const rows = await tsx
      .withSchema(SCHEMA)
      .table("CIONE_LotesSemanais")
      .select("Id as id", "NomeLote as nome")
      .andWhereILike("NomeLote", "%01-C%")
      .orderBy("NomeLote", "asc");

    return rows.map((r: { id: number; nome: string | null }) => ({
      id: r.id,
      nome: r.nome ?? `Lote ${r.id}`,
    }));
  }

    static async listarTipos(tsx: Knex = this.db): Promise<TipoObjetoOpcao[]> {
    const rows = await tsx
        .withSchema(SCHEMA)
        .table("TbObj")
        .select("CdObj as cdObj", "NmObj as nome")
        .whereIn("CdObj", [52913, 52914, 52916, 52917, 53089, 53093, 53097, 52917])
        .orderBy("NmObj", "asc");

    return rows.map((r: { cdObj: number; nome: string | null }) => ({
        cdObj: r.cdObj,
        nome: r.nome ?? `Tipo ${r.cdObj}`,
    }));
    }
}