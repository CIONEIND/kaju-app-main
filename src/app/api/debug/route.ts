import LocalizacoesRepository from "@/lib/top-manager/repository/localidade/localidadeRepository";
import { TipoLocalidade } from "@/lib/top-manager/repository/localidade/types";
import { NextResponse } from "next/server";


export async function GET(req: Request) {

    const  { searchParams } = new URL(req.url);

    const tpLocalizacao = searchParams.get("tipo");

    if(!tpLocalizacao){
        return NextResponse.json(
            {error: "Tipo inválido"},
            { status: 400}
        )
    }



    const result = await LocalizacoesRepository.findAllByTipoLocalizacao(Number(tpLocalizacao));

    return NextResponse.json(result)
}