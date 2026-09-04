import type { Knex } from "knex";
import { type NextRequest, NextResponse } from "next/server";

import { createClientSchema } from "@/app/(protected)/clientes/schemas/clientAddress";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { getTopManagerDB } from "@/lib/top-manager/db/resolve-db";
import ClienteService from "@/lib/top-manager/service/cliente/cliente.service";
import { saveAddress } from "../route";

function authAwareStatus(error: unknown) {
  return error instanceof Error && error.message === "Não autorizado."
    ? 403
    : 400;
}

const db: Knex = getTopManagerDB("PROD");

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const clienteId = Number(id);

  if (Number.isNaN(clienteId)) {
    return NextResponse.json(
      { error: "ID do cliente inválido." },
      { status: 400 },
    );
  }

  try {
    await requirePermission(PERMISSIONS.CLIENTS_VIEW);

    const clienteService = new ClienteService();
    const client = await clienteService.getById(clienteId);

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar cliente.";

    return NextResponse.json(
      { error: message },
      { status: authAwareStatus(error) },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const clienteId = Number(id);

  if (Number.isNaN(clienteId)) {
    return NextResponse.json(
      { error: "ID do cliente inválido." },
      { status: 400 },
    );
  }

  try {
    await requirePermission(PERMISSIONS.CLIENTS_SAVE);

    const body = await request.json();
    const validation = createClientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const clienteService = new ClienteService();

    const result = await db.transaction(async (tsx) => {
      const [codLigacoLogradouro, codLogradouro, codBairro] = await saveAddress(
        validation.data,
        tsx,
      );

      return clienteService.update(
        clienteId,
        validation.data,
        {
          cdLlg: codLigacoLogradouro,
          cdLgr: codLogradouro,
          cdLoc: codBairro,
        },
        tsx,
      );
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar cliente.";

    return NextResponse.json(
      { error: message },
      { status: authAwareStatus(error) },
    );
  }
}

export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const clienteId = Number(id);

  if (Number.isNaN(clienteId)) {
    return NextResponse.json(
      { error: "ID do cliente inválido." },
      { status: 400 },
    );
  }

  try {
    await requirePermission(PERMISSIONS.CLIENTS_SAVE);

    const clienteService = new ClienteService();
    await clienteService.deactivate(clienteId);

    return NextResponse.json({
      message: "Cliente desativado com sucesso.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao desativar cliente.";

    return NextResponse.json(
      { error: message },
      { status: authAwareStatus(error) },
    );
  }
}
