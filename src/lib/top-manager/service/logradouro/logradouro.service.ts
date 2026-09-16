import { Knex } from "knex";

import { topManager } from '../../db/knex-topManger';
import TipoLogradouroRepository from "../../repository/logradouro/tipoLogradouroRepository";
import LogradouroRepository from "../../repository/logradouro/lougradouroRepository";
import LocalidadeRepository from "../../repository/localidade/localidadeRepository";
import LigacaoLogradouroRepository from "../../repository/logradouro/ligacaoLogradouroRepository";
import { LigacaoLogradouro, Logradouro } from "../../repository/logradouro/types";


export class LogradouroService{
    private tsx: Knex = topManager;
    private tipLogRepository = TipoLogradouroRepository;
    private logRepository = LogradouroRepository;
    private localidadeRepository = LocalidadeRepository;
    private ligLogRepository = LigacaoLogradouroRepository;

    async create(nomeLogradouro: string, nomeTipoLogradouroIn: string, cdLocMae: number, tsx = this.tsx): Promise<number[]> {
        if(!nomeLogradouro || nomeLogradouro.trim().length === 0) throw new Error("Informe o nome do logradouro");
        if(!nomeTipoLogradouroIn || nomeTipoLogradouroIn.trim().length === 0) throw new Error("Informe o tipo do logradouro");

        const localidadeMae = await this.localidadeRepository.findById(cdLocMae, tsx);
        if(!localidadeMae) throw new Error("Localidade mãe para logradouro não encontrada");

        let codTipoLogradouro: number;

        const tipoLogradouro = await this.tipLogRepository.findByName(nomeTipoLogradouroIn, tsx);
        codTipoLogradouro = tipoLogradouro ? tipoLogradouro.CdTlg : 31;

        const logradouro: Logradouro = {
                "NmLgr": nomeLogradouro,
                "CdTlg": codTipoLogradouro,
                "SiteId": 17,
        }

        const ligacaoLogradouro: LigacaoLogradouro = {
            "CdLoc": cdLocMae,
        }

        // const result = await tsx.transaction(async (tsx) => {
            const logradouroId = await this.logRepository.save(logradouro, tsx);
            ligacaoLogradouro.CdLgr = logradouroId;
            const ligacaoLogradouroId = await this.ligLogRepository.save(ligacaoLogradouro, tsx);

            return [ligacaoLogradouroId, logradouroId];
        // });

        // return result;
    }
}