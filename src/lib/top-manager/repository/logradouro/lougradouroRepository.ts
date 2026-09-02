import { Knex } from "knex";
import { getTopManagerDB } from "../../db/resolve-db";
import { Logradouro } from "./types";



export default class LogradouroRepository {
    static tableName = "TbLgr";
    static db: Knex = getTopManagerDB("DESE")

    static async findByNomeLike(nome: string, tsx = this.db): Promise<Logradouro[]> {
        return tsx.table(this.tableName).whereILike("NmLgr", nome);
    }

    static async save(obj: any, tsx = this.db) {
        const query = tsx.table(this.tableName).insert(obj).toSQL();

        const result = await tsx.raw(`
                ${query.sql};
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS CdTlg;
            `, query.bindings);

        return result[0].CdTlg; 
    }
}