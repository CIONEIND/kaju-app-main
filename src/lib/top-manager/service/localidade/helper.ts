import { Knex } from 'knex';
import LocalidadeRepository from '../../repository/localidade/localidadeRepository';
import { Localidade } from '../../repository/localidade/types';

/**
 * Cria a string TtLoc para uma Localidade com base na hierarquia das colunas CdLocxxx
 * @param localidade 
 * @returns 
 */
export async function buildTtLoc(localidade: Localidade, tsx: Knex): Promise<string> {

  if(!localidade) throw new Error("Informe uma localidade");

  let ttLoc: string = localidade.NmLoc + '/';

  if(localidade.CdLoc005) {
    const obj = await LocalidadeRepository.findById(localidade.CdLoc005, tsx);
    ttLoc += obj.SgLoc + '/';
  }

  if(localidade.CdLoc004) {
    const obj = await LocalidadeRepository.findById(localidade.CdLoc004, tsx);
    ttLoc += obj.SgLoc + '/';
  }

  if(localidade.CdLoc003) {
    const obj = await LocalidadeRepository.findById(localidade.CdLoc003, tsx);
    ttLoc += obj.SgLoc + '/';
  }

  if(localidade.CdLoc002) {
    const obj = await LocalidadeRepository.findById(localidade.CdLoc002, tsx);
    ttLoc += obj.SgLoc + '/';
  }

  if(localidade.CdLoc001) {
    const obj = await LocalidadeRepository.findById(localidade.CdLoc001, tsx);
    ttLoc += obj.SgLoc + '/';
  }

  return ttLoc.substring(0, ttLoc.length-1);
}

export async function resolveCodLocs(localidade: Localidade, codLocPai: number, tsx: Knex) {
  if (!localidade) throw new Error("Informe uma localidade");
  if (!codLocPai) throw new Error("Infor o codLocal hierarquico superior mais proximo");

  let foundHierarchicalCods: number[] = [codLocPai];
  let currentCodLoc: number | null = codLocPai;

  while(true) {
    let localidade = await LocalidadeRepository.findById(currentCodLoc!, tsx);
    if(!localidade || !localidade.CdLocMae) break;
    currentCodLoc = localidade.CdLocMae;
    foundHierarchicalCods.push(currentCodLoc);
  }

  type LocalidadeKey = keyof Localidade;
  foundHierarchicalCods.reverse().forEach((cod, idx) => {
    let prop = `CdLoc00${idx+1}` as LocalidadeKey;
    console.log("prop", prop);
    (localidade as Record<string, string | null>)[prop] = cod as any;
  })

  return localidade;
}