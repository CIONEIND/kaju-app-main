import type { Knex } from "knex";
import type { CreateClientSchemaType } from "@/app/(protected)/clientes/schemas/clientAddress";
import { getTopManagerDB } from "../../db/resolve-db";
import ClienteRepository from "../../repository/cliente/cliente.repository";
import type {
  Cliente,
  ClienteConsultaPage,
  ClienteDetalhe,
  ClienteUpdateInput,
} from "../../repository/cliente/type";
import type { CreateClienteSchemaType } from "./schemas";
import { createClienteSchema, listClienteSchema } from "./schemas";

export default class ClienteService {
  private db: Knex = getTopManagerDB("DESE");
  private clienteRepo = ClienteRepository;

  async create(createDTO: CreateClienteSchemaType, tsx: Knex = this.db) {
    const validation = createClienteSchema.safeParse(createDTO);

    if (!validation.success) {
      throw new Error(validation.error.message);
    }

    const maxNrCliOrd003 = await this.clienteRepo.findMaxNrCliOrd003(tsx);

    const novoCliente: Cliente = {
      NmCli: createDTO.nome,
      CdPes: createDTO.cdPes,

      // Defaults requested
      TpCliNiv: 4,
      QtCliEnt: 0,
      FlCliNaoAtv: 0,
      FlCliTcb: 0,
      NrCliOrd001: 1,
      NrCliOrd002: 1,
      NrCliOrd003: Number(maxNrCliOrd003) + 1,
      CdCli001: 2,
      CdCli002: 3,

      // ISO String format for SQL Server (YYYY-MM-DD HH:mm:ss)
      // DtCliInc: new Date().toISOString().slice(0, 19).replace('T', ' '),
      // DtCliInc: `${new Date().toISOString().slice(0, 16).replace('T', ' ')}:00.000`,
      DtCliInc: `${new Date().toISOString().slice(0, 10)} 00:00:00.000`,

      // Currency configuration
      CdInf: Number(createDTO.cdInf),

      // Market configuration
      CdAve: Number(createDTO.cdAve),

      // Nível logic (3 for regular companies, 4 for Filial)
      NrCliNiv: 3, //TODO trabalhar filiais (4)

      // Mother Company configuration
      CdCliMae: createDTO.cdAve === "84" ? 3 : 261,
    };

    const novoClienteId = await this.clienteRepo.save(novoCliente, tsx);

    await tsx(ClienteRepository.tableName)
      .where({ CdCli: novoClienteId })
      .update({
        CdCliMat: novoClienteId,
        CdCli003: novoClienteId,
      });
  }

  async list(
    listDTO: unknown,
    tsx: Knex = this.db,
  ): Promise<ClienteConsultaPage> {
    const validation = listClienteSchema.safeParse(listDTO);

    if (!validation.success) {
      throw new Error(validation.error.message);
    }

    return this.clienteRepo.findPaged(validation.data, tsx);
  }

  async getById(
    cdCli: number,
    tsx: Knex = this.db,
  ): Promise<ClienteDetalhe | null> {
    return this.clienteRepo.findById(cdCli, tsx);
  }

  async update(
    cdCli: number,
    updateDTO: CreateClientSchemaType,
    addressIds: { cdLlg: number; cdLgr: number; cdLoc: number },
    tsx: Knex = this.db,
  ): Promise<ClienteDetalhe> {
    const current = await this.clienteRepo.findById(cdCli, tsx);

    if (!current) {
      throw new Error("Cliente não encontrado.");
    }

    const normalizedCpfCnpj = updateDTO.cpfCnpj;

    // if (
    //   normalizedCpfCnpj !== current.cpfCnpj &&
    //   (await PessoaRepository.findByCpfCnpj(Number(normalizedCpfCnpj), tsx))
    // ) {
    //   throw new Error("Cliente já existe na base de dados");
    // }

    const payload: ClienteUpdateInput = {
      nomePessoa: updateDTO.nomePessoa,
      cpfCnpj: normalizedCpfCnpj,
      rg: updateDTO.rg ?? "",
      tipoPessoa: updateDTO.tipoPessoa,
      cdAve: updateDTO.cdAve,
      cdInf: updateDTO.cdInf,
      cdLlg: addressIds.cdLlg,
      cdLgr: addressIds.cdLgr,
      cdLoc: addressIds.cdLoc,
      numLogradouro: updateDTO.streetNumber,
      cep: updateDTO.postalCode,
    };

    await this.clienteRepo.updateById(cdCli, payload, tsx);

    const updated = await this.clienteRepo.findById(cdCli, tsx);

    if (!updated) {
      throw new Error("Cliente não encontrado.");
    }

    return updated;
  }

  async deactivate(cdCli: number, tsx: Knex = this.db) {
    const updatedRows = await this.clienteRepo.deactivateById(cdCli, tsx);

    if (!updatedRows) {
      throw new Error("Cliente não encontrado.");
    }
  }
}
