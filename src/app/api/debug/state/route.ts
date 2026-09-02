import { LocalidadeService } from '@/lib/top-manager/service/localidade/localidade.service';
import { NextRequest, NextResponse } from 'next/server';



export async function POST(req: NextRequest) {
  const { name, codPais} = await req.json();
  const service = new LocalidadeService();

  try{
    const response = await service.createState(name, codPais);
    return NextResponse.json(response);
  }catch(err: any) {

    return NextResponse.json({
      error: err?.message
    }, { status: 400 })
  }


}