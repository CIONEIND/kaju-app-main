import { Knex } from "knex";
import { topManagerProducao } from "./knex-top-manager-producao";
import { topManagerDesenvolvimento } from "./knex-top-manager-desenvolvimento";


export function getTopManagerDB(instance: "DESE" | "PROD"): Knex {

    if(instance === "PROD") {
        return topManagerProducao;
    }else if (instance === "DESE") {
        return topManagerDesenvolvimento;
    }else{
        throw new Error("Instância do banco de dados top manager inválida.");
    }
}