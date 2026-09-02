import { Knex } from "knex";
import { getTopManagerDB } from "../../db/resolve-db";
import { LigacaoLogradouro } from "./types";


export default class LigacaoLogradouroRepository {
    static tableName = "TbLlg";
    static db: Knex = getTopManagerDB("DESE");

    static async findByCdLgr(cdLgr: number, tsx = this.db): Promise<LigacaoLogradouro> {
        return tsx.table(this.tableName).where("CdLgr", cdLgr).first();
    }

    static async findByCdLgrAndCdLoc(cdLgr: number, cdLoc: number, tsx = this.db): Promise<LigacaoLogradouro> {
        return tsx.table(this.tableName).where("CdLgr", cdLgr)
        .andWhere("CdLoc", cdLoc).first();
    }

    static async save(obj: any, tsx = this.db) {
        const query = tsx.table(this.tableName).insert(obj).toSQL();

        const result = await tsx.raw(`
                ${query.sql};
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS CdLlg;
            `, query.bindings);

        return result[0].CdLlg; 
    }
}