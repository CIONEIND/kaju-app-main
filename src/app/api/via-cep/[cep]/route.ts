import getCep from "@/lib/via-cep/viaCepService";
import { NextRequest, NextResponse } from "next/server";

type Params =  {
    params: Promise<{
        cep: string
    }>
}

export async function GET(req: NextRequest, { params }: Params) {
    
    const {  cep  } = await params;

    return NextResponse.json(await getCep(cep));
}