import { LocalidadeService } from '@/lib/top-manager/service/localidade/localidade.service';
import { NextRequest, NextResponse } from 'next/server';



export async function POST(req: NextRequest) {
  const { name, codEstado} = await req.json();
  const service = new LocalidadeService();

  try{
    const response = await service.createCidade(name, codEstado);

    console.log(" RESponse", response)
    return NextResponse.json(response);
  }catch(err: any) {

    console.error(err )
    return NextResponse.json({
      error: err?.message
    }, { status: 400 })
  }


}