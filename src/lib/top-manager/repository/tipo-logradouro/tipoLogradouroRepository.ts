import { TipoLogradouro } from "./type";
import { getTopManagerDB } from "../../db/resolve-db";
import { Knex } from "knex";


export default class TipoLogradouroRepository {
    static tableName = "TbTlg";
    static db: Knex = getTopManagerDB("DESE")

    static findAll(): Promise<TipoLogradouro[]> {
        return this.db.table(this.tableName);
    }
}