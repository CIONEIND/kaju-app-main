import { Knex } from "knex";
import { topManager } from '../../db/knex-topManger';
import { CreatePessoaDTO } from "./types";
import { Pessoa } from "../../repository/pessoa/types";
import { createPessoaSchema, CreatePessoaSchemaType } from "./schemas";
import PessoaRepository from "../../repository/pessoa/pessoa.repository";



export default class PessoaService {
    private db: Knex = topManager;
    private pessoaRepo = PessoaRepository;

    async create(createDTO: CreatePessoaSchemaType, tsx = this.db) {


        const validation = createPessoaSchema.safeParse(createDTO);

        if(!validation.success) {
            throw new Error(validation.error.message);
        }


        const pessoa: Pessoa = {
            NmPes: createDTO.nomePessoa,
            NrPesCpj: createDTO.cpfCnpj ? Number(createDTO.cpfCnpj) : undefined,
            NrPesCgf: createDTO.rg,
            TpPes: 1,
            TipoDeRegistro: 1,
            TipoDePessoa: Number(createDTO.tipoPessoa),
            Sexo: 0,
            FlPesPro: 0,
            CdAve: createDTO.cdAve ? Number(createDTO.cdAve) : undefined,
            CdLlg: createDTO.cdLlg,
            CdLgr: createDTO.cdLgr,
            CdLoc: createDTO.cdLoc,
            NrPesEdr: createDTO.numLogradouro,
            NrPesEdrCep: createDTO.cep?.toString(),
            PessoaTransportadora: 0,
            EstabelecimentoTransportador: 0,
            NrPesNiv: 1,
        }


        return await this.pessoaRepo.save(pessoa, tsx);
    }
}