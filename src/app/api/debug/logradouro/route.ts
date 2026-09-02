import { LocalidadeService } from '@/lib/top-manager/service/localidade/localidade.service';
import { LogradouroService } from '@/lib/top-manager/service/logradouro/logradouro.service';
import { NextRequest, NextResponse } from 'next/server';



export async function POST(req: NextRequest) {
  const { nomeLogradouro, nomeTipoLogradouro, cdLocMae} = await req.json();
  const service = new LogradouroService();

  try{
    const response = await service.create(nomeLogradouro, nomeTipoLogradouro, Number(cdLocMae))
    return NextResponse.json(response);
  }catch(err: any) {

    console.error(err )
    return NextResponse.json({
      error: err?.message
    }, { status: 400 })
  }
}