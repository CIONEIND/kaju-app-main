import { Knex } from 'knex';
import { getTopManagerDB } from '../../db/resolve-db'
import { topManager } from '../../db/knex-topManger';
import { CreateBairro } from './types';
import LocalidadeRepository from '../../repository/localidade/localidadeRepository';
import { Localidade, TipoLocalidade } from '../../repository/localidade/types';
import { capitalizeWords } from '@/utils/string-util';
import { getCountryCodeByName } from '@/utils/bacen/bacen-utils';
import { getDdiByCountryName } from '@/utils/country/ddi';
import { buildTtLoc, resolveCodLocs } from './helper';

export class LocalidadeService {
  private tsx: Knex = topManager;
  private localidadeRepositoy = LocalidadeRepository;

  async createPais(nome: string, tsx = this.tsx): Promise<number> {

    if(!nome || nome?.trim()?.length === 0) {
      throw new Error("Informe um nome de pais valido");
    }

    const parsedName = capitalizeWords(nome);

    const foundPais = await this.localidadeRepositoy.findByNomeLikeAndTipo(parsedName, TipoLocalidade.PAIS);
    if(foundPais.length > 0)
      throw new Error("O pais ja existe");

    const codigoBacen = getCountryCodeByName(parsedName);

    if(!codigoBacen)
      throw new Error("Nao foi possivel determianr o codigo bacen para o pais informado");

    const ddi = getDdiByCountryName(parsedName);

    let pais: Localidade = {
      NmLoc: parsedName,
      TtLoc: parsedName,
      SgLoc: nome.substring(0,2).toUpperCase(),
      TpLoc: TipoLocalidade.PAIS,
      NrLocNiv: 1,
      NrLocBcb: codigoBacen,
      NrLocDDI: ddi,
      SiteID: 17
    }

    const result = await tsx.transaction(async (tsx) => {
      const id = await this.localidadeRepositoy.save(pais, tsx);
      await  this.localidadeRepositoy.update(id, { CdLoc001: id }, tsx);
      return id;
    })

    return result;
  }



  /**
   * Cria estados de nacoes estrangeiras
   * @param stateName Estado de nacao estrangeiro. i.e. New York
   */
  async createState(stateName: string, codPais: number, tsx = this.tsx): Promise<number> {
    if(!codPais) throw new Error("Informe o ID do pais");
    if(stateName?.trim()?.length === 0) throw new Error("Informe o nome do estado");

    const pais = await this.localidadeRepositoy.findById(codPais, tsx);
    if(!pais) throw new Error("Pais nao existe");

    const parsedName = capitalizeWords(stateName);

    console.log("parsedName", parsedName)

    const foundState = await this.localidadeRepositoy.findEstadoByNomeAndCodPais(parsedName, codPais, tsx);
    if(foundState)
      throw new Error("O estado ja existe");

    let state: Localidade = {
      NmLoc: parsedName,
      SgLoc: parsedName.substring(0,2).toUpperCase(), //TODO melhorar para buscar a sigla utilizada
      TpLoc: TipoLocalidade.ESTADO,
      CdLocMae: pais.CdLoc,
      TtLoc: `${parsedName}/${pais.SgLoc}`,
      NrLocNiv: 2,
      CdLoc001: pais.CdLoc,
      SiteID: 17
    }

    // const result = await tsx.transaction(async (tsx) => {
      const id = await this.localidadeRepositoy.save(state, tsx);
      await this.localidadeRepositoy.update(id, { CdLoc002: id }, tsx);
      return id;
    // })

    // return result;

  }

  async createCidade(nomeCidade: string, codEstado: number, tsx = this.tsx): Promise<number> {
    if(!nomeCidade || nomeCidade.trim().length === 0) throw new Error("Informe o nome da cidade");
    if(!codEstado) throw new Error("Informe o codigo do Estado");

    const estado = await LocalidadeRepository.findById(codEstado, tsx);
    if(!estado) throw new Error("Estado nao encontrado");

    const parsedName = capitalizeWords(nomeCidade);
    const foundCidade = await LocalidadeRepository.findCidadeByNomeAndCodEstado(parsedName, codEstado, tsx);

    if(foundCidade) throw new Error("Cidade ja existe");

    let city: Localidade = {
      NmLoc: parsedName,
      SgLoc: parsedName.substring(0,2).toUpperCase(), //TODO melhorar para buscar a sigla utilizada
      TpLoc: TipoLocalidade.CIDADE,
      CdLocMae: estado.CdLoc,
      SiteID: 17
    }

    city = await resolveCodLocs(city, estado.CdLoc!, tsx);
    city.TtLoc =  await buildTtLoc(city, tsx);
    city.NrLocNiv = city.TtLoc.split("/").length;

    console.log({city})

    // const result = await tsx.transaction(async (tsx) => {
      const id = await this.localidadeRepositoy.save(city, tsx);
      const updateCdLoc  = { [`CdLoc00${city.NrLocNiv}`]: id}
      await this.localidadeRepositoy.update(id, updateCdLoc, tsx);
      return id;
    // })

    // return result;


  }

  async createBairro(nomeBairro: string, codCidade: number, tsx = this.tsx) {
    if(!nomeBairro || nomeBairro.trim().length === 0) throw new Error("Informe o nome da cidade");
    if(!codCidade) throw new Error("Informe o codigo do Cidade");

    const cidade = await LocalidadeRepository.findById(codCidade, tsx);
    if(!cidade) throw new Error("Cidade nao encontrado");

    const parsedName = capitalizeWords(nomeBairro);
    const foundBairro = await LocalidadeRepository.findBairroByNomeAndCodCidade(parsedName, codCidade, tsx);

    if(foundBairro) throw new Error("Bairro ja existe");

    let bairro: Localidade = {
      NmLoc: parsedName,
      TpLoc: TipoLocalidade.BAIRRO,
      CdLocMae: cidade.CdLoc,
      SiteID: 17
    }

    bairro = await resolveCodLocs(bairro, cidade.CdLoc!, tsx);
    bairro.TtLoc =  await buildTtLoc(bairro, tsx);
    bairro.NrLocNiv = bairro.TtLoc.split("/").length;


    // const result = await tsx.transaction(async (tsx) => {
      const id = await this.localidadeRepositoy.save(bairro, tsx);
      const updateCdLoc  = { [`CdLoc00${bairro.NrLocNiv}`]: id}
      await this.localidadeRepositoy.update(id, updateCdLoc, tsx);
      return id;
    // })

    // return result;
  }

  setTsx(tsx: Knex) {
    this.tsx = tsx;
    return this;
  }
}