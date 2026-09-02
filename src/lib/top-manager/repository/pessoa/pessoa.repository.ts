import { Knex } from "knex";
import { getTopManagerDB } from "../../db/resolve-db";


export default class PessoaRepository{
    static db: Knex = getTopManagerDB("DESE");
    static tableName = "TbPes";

    static async findByCpfCnpj(cpfCnpj: number, tsx = this.db) {
        return !!(await tsx.table(this.tableName).select(tsx.raw("1")).where("NrPesCpj", cpfCnpj).first());
    }


    static async findById(cdPes: number, tsx = this.db) {
        return tsx.table(this.tableName).where("CdPes", cdPes).first();
    }

    static async save(obj: any, tsx = this.db) {
        const maxResult = await tsx.raw(`
            SELECT COALESCE(MAX(NrPesOrd001), 0) + 1 AS nextOrd 
            FROM ${this.tableName} WITH (UPDLOCK, HOLDLOCK)
        `);

        const nextOrd = maxResult[0]?.nextOrd || 1;
        obj.NrPesOrd001 = nextOrd;

        const query = tsx.table(this.tableName).insert(obj).toSQL();

        const result = await tsx.raw(`
            ${query.sql};
            SELECT CAST(SCOPE_IDENTITY() AS INT) AS CdPes;
        `, query.bindings);

        return result[0].CdPes;
        // const query = tsx.table(this.tableName).insert(obj).toSQL();

        // const result = await tsx.raw(`
        //       ${query.sql};
        //         SELECT CAST(SCOPE_IDENTITY() AS INT) AS CdPes;
        // `, query.bindings);

        // return result[0].CdPes; 
    }

}