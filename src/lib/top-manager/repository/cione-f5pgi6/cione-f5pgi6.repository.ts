import type { Knex } from "knex";
import { topManager } from "../../db/knex-topManger";
import type {
  AnaliseF5PGI6,
  CioneF5PGI6Row,
  FiltroAnaliseF5PGI6,
  LoteSemanalOpcao,
  OrigemOpcao,
  SiloOpcao,
  TipoObjetoOpcao,
} from "./types";
import { aplicarStatus } from "../filtro/analises-filtro";

const TABELA = "CIONE_F5PGI6";
const SCHEMA = "dbo";
/** CdObj das DIVISÕES MÃE de origem — CONFIRMAR os códigos */
const ORIGENS_CDOBJ_MAE = [52155];
const SILOS_CDOBJ_MAE = [53115];

function media(
  a: number | null,
  b: number | null,
  c: number | null,
): number | null {
  if (a === null || b === null || c === null) return null;
  return Math.round(((a + b + c) / 3 + 0.5) * 100) / 100;
}

function toAnalise(row: Record<string, unknown>): AnaliseF5PGI6 {
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
    siloId: (row.Silo as number | null) ?? null,
    siloNome: (row.SiloNome as string | null) ?? null,
    tipoId: (row.Tipo as number | null) ?? null,
    tipoNome: (row.TipoNome as string | null) ?? null,
    origemId: (row.Origem as number | null) ?? null,
    origemNome: (row.OrigemNome as string | null) ?? null,
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

export default class CioneF5PGI6Repository {
  static db: Knex = topManager;
  static tableName = TABELA;

  /** Uma linha por análise, com nomes resolvidos e data/hora como TEXTO */
  static baseQuery(tsx: Knex = this.db) {
    return tsx
      .withSchema(SCHEMA)
      .from(`${TABELA} as C`)
      .leftJoin("TbObj as ObjTp", "ObjTp.CdObj", "C.Tipo")
      .leftJoin("TbObj as ObjSilo", "ObjSilo.CdObj", "C.Silo")
      .leftJoin("TbObj as ObjOrigem", "ObjOrigem.CdObj", "C.Origem")
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
        "C.Origem",
        "C.t1Amendoa",
        "C.t2Amendoa",
        "C.t3Amendoa",
        "C.t1Casca",
        "C.t2Casca",
        "C.t3Casca",
        "C.Status",
        "ObjTp.NmObj as TipoNome",
        "ObjSilo.NmObj as SiloNome",
        "ObjOrigem.NmObj as OrigemNome",
        "UsrResp.NmUsr as ResponsavelNome",
        "LS.NomeLote as LoteNome",
      );
  }

  private static aplicarFiltros(
    q: Knex.QueryBuilder,
    filtro: FiltroAnaliseF5PGI6,
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
    if (filtro.origemId !== undefined) q.where("C.Origem", filtro.origemId);
    if (filtro.responsavelCdUsr !== undefined) {
      q.where("C.Responsavel", filtro.responsavelCdUsr);
    }
    aplicarStatus(q, filtro);
  }

  static async listar(
    filtro: FiltroAnaliseF5PGI6 = {},
    tsx: Knex = this.db,
  ): Promise<AnaliseF5PGI6[]> {
    const q = this.baseQuery(tsx);
    this.aplicarFiltros(q, filtro);
    q.orderBy("C.DATAHORA", "desc").orderBy("C.ID", "desc");
    if (filtro.limite) q.limit(filtro.limite);
    if (filtro.offset) q.offset(filtro.offset);

    const rows = await q;
    return rows.map(toAnalise);
  }

  static async contar(
    filtro: FiltroAnaliseF5PGI6 = {},
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
  ): Promise<AnaliseF5PGI6 | null> {
    const row = await this.baseQuery(tsx).where("C.ID", id).first();
    return row ? toAnalise(row) : null;
  }

  /** INSERT com recuperação do IDENTITY (padrão do PessoaRepository) */
  static async inserir(
    dados: Omit<CioneF5PGI6Row, "ID">,
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
    dados: Omit<CioneF5PGI6Row, "ID">,
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
      .whereILike("NomeLote", "%CI-BR%")
      .orWhereILike("NomeLote", "%CH-BR%")
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
      .whereIn("CdObj", [52913, 52914, 52916, 52917])
      .orderBy("NmObj", "asc");

    return rows.map((r: { cdObj: number; nome: string | null }) => ({
      cdObj: r.cdObj,
      nome: r.nome ?? `Tipo ${r.cdObj}`,
    }));
  }

  static async listarSilos(tsx: Knex = this.db): Promise<SiloOpcao[]> {
    const rows = await tsx
      .withSchema(SCHEMA)
      .table("TbObj")
      .select("CdObj as cdObj", "NmObj as nome")
      .whereIn("CdObjMae", SILOS_CDOBJ_MAE)
      .orderBy("NmObj", "asc");

    return rows.map((r: { cdObj: number; nome: string | null }) => ({
      cdObj: r.cdObj,
      nome: r.nome ?? `Silo ${r.cdObj}`,
    }));
  }

    static async listarOrigens(tsx: Knex = this.db): Promise<OrigemOpcao[]> {
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

      static async contarRascunhos(
        cdUsr: number,
        tsx: Knex = this.db,
      ): Promise<number> {
        const rows = await tsx
          .withSchema(SCHEMA)
          .from(TABELA)
          .where("Status", 0)
          .where("Responsavel", cdUsr)
          .count({ total: "*" });
    
        return Number(rows[0]?.total ?? 0);
      }
}