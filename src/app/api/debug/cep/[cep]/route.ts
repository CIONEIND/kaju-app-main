// import LocalizacoesRepository from "@/lib/top-manager/repository/localidade/localidadeRepository";
// import { TipoLocalidade } from "@/lib/top-manager/repository/localidade/types";
// import LogradouroRepository from "@/lib/top-manager/repository/logradouro/lougradouroRepository";
// import TbLlgRepository from "@/lib/top-manager/repository/TbLlg/tbLlgRepository";
// import getCep from "@/lib/via-cep/viaCepService";
// import { NextRequest, NextResponse } from "next/server";

import { NextRequest, NextResponse } from "next/server";

// type Params = {
//     params: Promise<{
//         cep: string
//     }>
// }

export async function GET(req: NextRequest) {
    return NextResponse.json({})
}
// export async function GET(req: NextRequest, { params }: Params) {

//     const { cep } = await params;

//     //if is endereco no brasil ou fora

//     let cepResponse;
//     try{
//         cepResponse = await getCep(cep);
//     }catch(err) {
//         throw err;
//     }
    
//     const bairro = await LocalizacoesRepository.findByNomeLikeAndTipo(cepResponse.bairro, TipoLocalidade.BAIRRO);

//     if(!bairro || bairro.length === 0) {
//         //Criar bairro
//     }

//     const parsedLogradouro = cepResponse.logradouro.split(" ").slice(1).join(" ");
//     const logradouro = await LogradouroRepository.findByNomeLike(parsedLogradouro);

//     if(!logradouro || logradouro.length === 0) {
//         // cria logradouro
//     }

//     if(logradouro && bairro) {
//         //pesquisa relacionamento por cdlog e cdbairo
//     }else{
//         //criar registro em relacionamento
//     }


//     const relacionamento = await TbLlgRepository.findByTtLlgLikeAndCdLoc(parsedLogradouro, bairro?[0].CdLoc!)
//     // bairro, logradouro


//     /**
//      * 1. Pesquisa o bairro. Se não encontrar, cria o bairro.
//      * 2. Pesquisa o logradouro. Se não encontrar, cria o logradouro.
//      * 3. Caso tenha encontrado o bairro e o logradouro, pesquisar o TbLlg pelo nome do codLogradouo e pelo código do bairro utilizando findByCdLgrAndCdLoc. 
//      *  3.1. Caso não tenha encontrado o TbLLg. Criar um registro novo. Caso não tenha encontrado ou logradourou ou bairro ou ambos, criar também um novo regsitro.
//      */

//     // Se não encontar o bairro. Cria o Bairro.
//     // Se não encontar o logradouro. Cria o logradouro.
//     // 
    

   

//     return NextResponse.json({
//         parsedLogradouro,
//         cepResponse,
//         bairro,
//         logradouro,
//         relacionamento
//     })

// }