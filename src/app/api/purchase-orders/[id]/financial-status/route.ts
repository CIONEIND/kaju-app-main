import type { UpdatePurchaseOrderFinancialStatusPayload } from "@/lib/purchase-orders/api-types";
import { requirePurchaseOrderUser } from "@/lib/purchase-orders/auth";
import { isPurchaseOrderFinancialStatus } from "@/lib/purchase-orders/constants";
import { updatePurchaseOrderFinancialStatus } from "@/lib/purchase-orders/service";

function errorStatus(error: unknown) {
  return error instanceof Error && error.message === "Não autorizado."
    ? 401
    : 400;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const user = await requirePurchaseOrderUser();
    const payload =
      (await request.json()) as Partial<UpdatePurchaseOrderFinancialStatusPayload>;

    if (!isPurchaseOrderFinancialStatus(payload.financialStatus)) {
      return Response.json(
        { message: "Status financeiro é obrigatório." },
        { status: 400 },
      );
    }

    const order = await updatePurchaseOrderFinancialStatus(
      id,
      payload.financialStatus,
      user,
    );

    return Response.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar financeiro.";

    return Response.json({ message }, { status: errorStatus(error) });
  }
}
