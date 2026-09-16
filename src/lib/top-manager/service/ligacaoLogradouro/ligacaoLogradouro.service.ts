import {topManager} from "../../db/knex-topManger";
import LigacaoLogradouroRepository from "../../repository/logradouro/ligacaoLogradouroRepository";


export default class LigacaoLogradouroService{
    private db = topManager;
    private repository = LigacaoLogradouroRepository;
    async create(cdLgr: number, cdLoc: number, tsx = this.db): Promise<number> {
        return this.repository.save({"CdLgr": cdLgr, "CdLoc": cdLoc}, tsx);
    }
}