import { getTopManagerDB } from "@/lib/top-manager/db/resolve-db";
import ClienteService from "@/lib/top-manager/service/cliente/cliente.service";
import PessoaService from "@/lib/top-manager/service/pessoa/pessoa.service";
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {

    const body = await req.json();

    const {
        nomePessoa,
        cpfCnpj,
        rg,
        tipoPessoa,
        cdLlg,
        cdLgr,
        cdLoc,
        numLogradouro,
        cep,
        cdAve,
        cdInf
    } = body;

    const {

    } = body;

    const pessoaService = new PessoaService();
    const clienteService = new ClienteService();

    const db = getTopManagerDB("DESE");


    try{

        const cdPes = await db.transaction(async tsx => {
             const cdPes = await pessoaService.create({
                nomePessoa,
                cpfCnpj,
                rg,
                tipoPessoa,
                cdLlg,
                cdLgr,
                cdLoc,
                numLogradouro,
                cep,
                cdAve
            }, tsx);
             await clienteService.create({ nome: nomePessoa, cdPes, cdAve, cdInf }, tsx);

             return cdPes
        })
       
        return NextResponse.json({cdPes}, { status: 201})
    }catch(err) {
        console.error(err)
        return NextResponse.json({err}, {status: 400})
    }
}