import LocalizacoesRepository from "@/lib/top-manager/repository/localidade/localidadeRepository";
import { NextRequest, NextResponse } from "next/server";



export async function GET(req: NextRequest) {

    const { searchParams } = req.nextUrl;
    const nome = searchParams.get("nome");
    const tipo = searchParams.get("tipo");

    if(!nome || !tipo) {
        return NextResponse.json({
            error: "Nome e tipo são obrigatórios"
        }, { status: 400})
    }

    return NextResponse.json(await LocalizacoesRepository.findByNomeLikeAndTipo(nome, Number(tipo)))
}