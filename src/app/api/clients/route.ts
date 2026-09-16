import type { Knex } from "knex";
import { type NextRequest, NextResponse } from "next/server";
import { createClientSchema } from "@/app/(protected)/clientes/schemas/clientAddress";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { topManager } from '@/lib/top-manager/db/knex-topManger';
import LocalidadeRepository from "@/lib/top-manager/repository/localidade/localidadeRepository";
import { TipoLocalidade } from "@/lib/top-manager/repository/localidade/types";
import LigacaoLogradouroRepository from "@/lib/top-manager/repository/logradouro/ligacaoLogradouroRepository";
import LogradouroRepository from "@/lib/top-manager/repository/logradouro/lougradouroRepository";
import PessoaRepository from "@/lib/top-manager/repository/pessoa/pessoa.repository";
import ClienteService from "@/lib/top-manager/service/cliente/cliente.service";
import LigacaoLogradouroService from "@/lib/top-manager/service/ligacaoLogradouro/ligacaoLogradouro.service";
import { LocalidadeService } from "@/lib/top-manager/service/localidade/localidade.service";
import { LogradouroService } from "@/lib/top-manager/service/logradouro/logradouro.service";
import PessoaService from "@/lib/top-manager/service/pessoa/pessoa.service";
import { capitalizeWords } from "@/utils/string-util";

const db: Knex = topManager;

const localidadeRepository = LocalidadeRepository;
const logradouroRepo = LogradouroRepository;
const ligLogRepo = LigacaoLogradouroRepository;
const pessoaRepo = PessoaRepository;

const localidadeService = new LocalidadeService();
const logradouroService = new LogradouroService();
const ligLogService = new LigacaoLogradouroService();

export async function GET(request: NextRequest) {
  const clienteService = new ClienteService();

  try {
    await requirePermission(PERMISSIONS.CLIENTS_VIEW);

    const { searchParams } = request.nextUrl;

    const result = await clienteService.list({
      search: searchParams.get("search")?.replace(/^0+/, "") ?? "",
      page: searchParams.get("page") ?? "1",
      pageSize: searchParams.get("pageSize") ?? "10",
    });
    console.log("Result from clienteService.list:", result);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao consultar clientes.";

    return NextResponse.json(
      { error: message },
      { status: message === "Não autorizado." ? 403 : 400 },
    );
  }
}

/**
 *
 * @param data
 * @param tsx transação
 * @returns Retorna um array com codLigacaoLogradouro, codLogradouro, codBairro nas respectivas posições.
 */
export async function saveAddress(
  data: import("@/app/(protected)/clientes/schemas/clientAddress").CreateClientSchemaType,
  tsx: Knex,
): Promise<number[]> {
  let codPais: number;
  let codEstado: number;
  let codBairro: number;
  let codLogradouro: number;
  let codLigacoLogradouro: number;
  const countryName = data.country ?? "";

  if (!data.isBrazil) {
    //resolve pais
    console.log("PAISSSS");
    const pais = (
      await localidadeRepository.findByNomeLikeAndTipo(
        capitalizeWords(countryName),
        TipoLocalidade.PAIS,
        tsx,
      )
    )[0];
    if (!pais) {
      codPais = await localidadeService.createPais(countryName, tsx);
    } else {
      codPais = pais.CdLoc ?? 0;
    }

    if (!codPais) {
      throw new Error("País inválido.");
    }

    //resolve estado
    const parsedStateName = capitalizeWords(data.state);
    const foundEstado = await localidadeRepository.findEstadoByNomeAndCodPais(
      parsedStateName,
      codPais,
      tsx,
    );
    if (!foundEstado) {
      codEstado = await localidadeService.createState(
        parsedStateName,
        codPais,
        tsx,
      );
    } else {
      codEstado = foundEstado.CdLoc ?? 0;
    }
    if (!codEstado) {
      throw new Error("Estado inválido.");
    }

    //resolve street
    //TODO se não for endereco do brasil, precisamos padronizar o valor do tipo logradouro que vai vir do front.
  } else {
    //resolve country
    const brazilCountry = (
      await localidadeRepository.findByNomeLikeAndTipo(
        "Brasil",
        TipoLocalidade.PAIS,
        tsx,
      )
    )[0];
    codPais = brazilCountry?.CdLoc ?? 0;
    if (!codPais) {
      throw new Error("País Brasil não encontrado.");
    }

    //resolve state
    const foundEstadoBySigla = (
      await localidadeRepository.findEstadoBrasileiroBySigla(
        data.state.toUpperCase(),
        tsx,
      )
    )[0];
    const foundEstadoByName = foundEstadoBySigla
      ? foundEstadoBySigla
      : (
          await localidadeRepository.findByNomeLikeAndTipo(
            data.state,
            TipoLocalidade.ESTADO,
            tsx,
          )
        )[0];

    if (!foundEstadoByName) {
      throw new Error(
        "UF não encontrada. Por favor contate o administrador do sistema.",
      );
    }
    codEstado = foundEstadoByName.CdLoc ?? 0;
    if (!codEstado) {
      throw new Error(
        "UF não encontrada. Por favor contate o administrador do sistema.",
      );
    }
  }

  //resolve city
  const parsedCidadeName = capitalizeWords(data.city);

  const foundCidade = await localidadeRepository.findCidadeByNomeAndCodEstado(
    parsedCidadeName,
    codEstado,
    tsx,
  );
  const codCidade =
    foundCidade?.CdLoc ??
    (await localidadeService.createCidade(parsedCidadeName, codEstado, tsx));

  //resolve neighborhood
  const parsedBairroName = capitalizeWords(data.neighborhood);
  const foundBairro = await localidadeRepository.findBairroByNomeAndCodCidade(
    parsedBairroName,
    codCidade,
    tsx,
  );
  codBairro =
    foundBairro?.CdLoc ??
    (await localidadeService.createBairro(parsedBairroName, codCidade, tsx));

  //resolve street
  const streetTokens = data.street.split(" ");
  const [tipoLogradouroIn, nomeLogradouro] = [
    streetTokens[0],
    streetTokens.slice(1).join(" "),
  ];

  // TODO a função logradouroService.create salva em um tipologradouro geral caso não encontre
  // const validTiposLogradouro = await tipoLogradouroRepo.findAll();
  // const tipoLogradouro = validTiposLogradouro.filter(tp => tp.NmTlg.includes(capitalizeWords(tipoLogradouroIn)));
  // if(tipoLogradouro.length === 0)
  //     throw new Error("Tipo de Logradouro inválido");

  const parsedLogradouroName = capitalizeWords(nomeLogradouro);
  const foundLogradouro = (
    await logradouroRepo.findByNomeLike(parsedLogradouroName, tsx)
  )[0];
  if (!foundLogradouro) {
    const [codLigLog, codLog] = await logradouroService.create(
      parsedLogradouroName,
      tipoLogradouroIn,
      codBairro,
      tsx,
    );
    codLogradouro = codLog;
    codLigacoLogradouro = codLigLog;
  } else {
    codLogradouro = foundLogradouro.CdLgr ?? 0;
    if (!codLogradouro) {
      throw new Error("Logradouro inválido.");
    }
    const ligLogradouro = await ligLogRepo.findByCdLgrAndCdLoc(
      codLogradouro,
      codBairro,
      tsx,
    );

    console.log("**((*(*(*(*(**(*(*(*(*((**(*(*(*(*((*", ligLogradouro);
    codLigacoLogradouro =
      ligLogradouro?.CdLlg ??
      (await ligLogService.create(codLogradouro, codBairro, tsx));
  }

  return [codLigacoLogradouro, codLogradouro, codBairro];
}

export async function POST(request: NextRequest) {
  const pessoaService = new PessoaService();
  const clienteService = new ClienteService();
  try {
    await requirePermission(PERMISSIONS.CLIENTS_SAVE);

    // 1. Parse the incoming JSON body
    const body = await request.json();

    // 2. Print what was received from the frontend
    console.log("=== INCOMING CLIENT DATA ===");
    console.log(body);
    console.log("============================");

    // 3. Validate the data using your Zod schema
    const validationResult = createClientSchema.safeParse(body);

    if (!validationResult.success) {
      // If validation fails, log the errors and return a 400 Bad Request
      console.error("Zod Validation Failed:", validationResult.error.format());
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    // 4. Data is fully typed and validated at this point
    const validData = validationResult.data;

    const personExists =
      validData.cpfCnpj &&
      (await pessoaRepo.findByCpfCnpj(parseInt(validData.cpfCnpj, 10)));

    if (personExists) {
      return NextResponse.json(
        {
          error: "Cliente já existe na base de dados",
        },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tsx) => {
      const [codLigacoLogradouro, codLogradouro, codBairro] = await saveAddress(
        validData,
        tsx,
      );

      const {
        nomePessoa,
        cpfCnpj,
        rg,
        tipoPessoa,
        numLogradouro,
        cep,
        cdAve,
        cdInf,
      } = body;

      const cdPes = await pessoaService.create(
        {
          nomePessoa,
          cpfCnpj,
          rg,
          tipoPessoa,
          cdLlg: codLigacoLogradouro,
          cdLgr: codLogradouro,
          cdLoc: codBairro,
          numLogradouro,
          cep,
          cdAve,
        },
        tsx,
      );

      await clienteService.create(
        { nome: nomePessoa, cdPes, cdAve, cdInf },
        tsx,
      );

      return [codLigacoLogradouro, codLogradouro, codBairro];
    });

    // Return success response to frontend
    return NextResponse.json(
      { message: "Cliente salvo com sucesso!", data: result },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Não autorizado.") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Endpoint Error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor / Internal Server Error" },
      { status: 500 },
    );
  }
}
