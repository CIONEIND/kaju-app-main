import TipoLogradouroRepository from "@/lib/top-manager/repository/tipo-logradouro/tipoLogradouroRepository";
import { NextRequest, NextResponse } from "next/server";



export async function GET(req: NextRequest) {

    return NextResponse.json(await TipoLogradouroRepository.findAll())
}