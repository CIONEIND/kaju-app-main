import { Localidade, TipoLocalidade } from "./types";
import { getTopManagerDB } from "../../db/resolve-db";
import { Knex } from "knex";

export default class LocalidadeRepository {
    static tableName = 'TbLoc';
    static db: Knex = getTopManagerDB("DESE")

    static async findById(cdLoc: number, tsx = this.db): Promise<Localidade> {
        return tsx.table(this.tableName).where("CdLoc", cdLoc).first();
    }

    static async findAllByTipoLocalizacao(tipo : TipoLocalidade, tsx = this.db): Promise<Localidade[]> {
        return tsx.table(this.tableName).where("TpLoc", tipo)
    }

    static async findAllPaises(tsx = this.db): Promise<Localidade[]> {
        return tsx.table(this.tableName).where("TpLoc", 1);
    }

    static async findAllRegioes(tsx = this.db): Promise<Localidade[]> {
        return tsx.table(this.tableName).where("TpLoc", )
    }

    static async findByNomeLikeAndTipo(nome: string, tipo: TipoLocalidade, tsx = this.db): Promise<Localidade[]> {
        return tsx.table(this.tableName).whereILike("NmLoc", `%${nome}%`).andWhere("TpLoc", tipo)
    }

    static async findEstadoByNomeAndCodPais(nome: string, codPais: number, tsx = this.db): Promise<Localidade> {
        return tsx.table(this.tableName).whereILike("NmLoc", `%${nome}%`)
            .andWhere("TpLoc", TipoLocalidade.ESTADO)
            .andWhere("CdLocMae", codPais).first();
    }

    static async findEstadoBrasileiroBySigla(sigla: string, tsx = this.db): Promise<Localidade[]> {
        return tsx
            .table('TbLoc as loc1')
            .innerJoin('TbLoc as loc2', 'loc1.CdLocMae', 'loc2.CdLoc')
            .where('loc1.SgLoc', sigla)
            .where('loc2.CdLocMae', 1965)
            .where('loc1.TpLoc', 3)
            .select('loc1.*');
    }

    static async findCidadeByNomeAndCodEstado(nome: string, codEstado: number, tsx = this.db): Promise<Localidade> {
        return tsx.table(this.tableName).whereILike("NmLoc", `%${nome}%`)
            .andWhere("TpLoc", TipoLocalidade.CIDADE)
            .andWhere("CdLocMae", codEstado).first();
    }

    static async findBairroByNomeAndCodCidade(nome: string, codCidade: number, tsx = this.db): Promise<Localidade> {
        return tsx.table(this.tableName).whereILike("NmLoc", `%${nome}%`)
            .andWhere("TpLoc", TipoLocalidade.BAIRRO)
            .andWhere("CdLocMae", codCidade).first();
    }

    static async save(obj: any, tsx = this.db): Promise<number> {
        const query = tsx.table(this.tableName).insert(obj).toSQL();

        const result = await tsx.raw(`
                ${query.sql};
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS CdLoc;
            `, query.bindings);

        return result[0].CdLoc;
    }

    static async update(cdLoc:number, obj: any, tsx = this.db): Promise<Localidade> {
        return tsx.table(this.tableName).where( { CdLoc: cdLoc}).update(obj);
    }
}