import { LocalidadeService } from '@/lib/top-manager/service/localidade/localidade.service';
import { NextRequest, NextResponse } from 'next/server';



export async function POST(req: NextRequest) {
  const { name, codCidade} = await req.json();
  const service = new LocalidadeService();

  try{
    const response = await service.createBairro(name, codCidade);
    return NextResponse.json(response);
  }catch(err: any) {

    console.error(err )
    return NextResponse.json({
      error: err?.message
    }, { status: 400 })
  }
}