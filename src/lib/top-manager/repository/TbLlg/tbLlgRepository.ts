import { getTopManagerDB } from "../../db/resolve-db";
import { Knex } from "knex";



export default class TbLlgRepository {
    static tableName = "TbLlg";
    static db: Knex = getTopManagerDB("DESE")

    static async findByCdLgrAndCdLoc(codLogradouro: number, codLocalizacao: number) {
        return this.db.table(this.tableName).where("CdLgr", codLogradouro).andWhere("CdLoc", codLocalizacao);
    }

    static async findByTtLlgLikeAndCdLoc(ttLlg: string, codLocalizacao: number) {
        return this.db.table(this.tableName).whereILike("TtLlg", `%${ttLlg}%`).andWhere("CdLoc", codLocalizacao);
    }
}