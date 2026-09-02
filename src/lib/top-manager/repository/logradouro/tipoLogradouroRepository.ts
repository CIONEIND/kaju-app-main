import { Knex } from "knex";
import { getTopManagerDB } from "../../db/resolve-db";
import { TipoLogradouro } from "../tipo-logradouro/type";


export default class TipoLogradouroRepository {
    static tableName = "TbTlg";
    static db: Knex = getTopManagerDB("DESE");

    static async findAll(tsx = this.db): Promise<TipoLogradouro[]> {
        return  tsx.table(this.tableName);
    }

    static async findByName(name: string, tsx = this.db): Promise<TipoLogradouro> {
        return tsx.table(this.tableName).whereILike("NmTlg", `%${name.trim()}%`).first();
    }
}