import { getTopManagerDB } from "../../db/resolve-db";
import LigacaoLogradouroRepository from "../../repository/logradouro/ligacaoLogradouroRepository";


export default class LigacaoLogradouroService{
    private db = getTopManagerDB("DESE");
    private repository = LigacaoLogradouroRepository;
    async create(cdLgr: number, cdLoc: number, tsx = this.db): Promise<number> {
        return this.repository.save({"CdLgr": cdLgr, "CdLoc": cdLoc}, tsx);
    }
}