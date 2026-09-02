import type { UpdatePurchaseOrderStockStatusPayload } from "@/lib/purchase-orders/api-types";
import { requirePurchaseOrderUser } from "@/lib/purchase-orders/auth";
import { isPurchaseOrderStockStatus } from "@/lib/purchase-orders/constants";
import { updatePurchaseOrderStockStatus } from "@/lib/purchase-orders/service";

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
      (await request.json()) as Partial<UpdatePurchaseOrderStockStatusPayload>;

    if (!isPurchaseOrderStockStatus(payload.stockStatus)) {
      return Response.json(
        { message: "Status de estoque é obrigatório." },
        { status: 400 },
      );
    }

    const order = await updatePurchaseOrderStockStatus(
      id,
      payload.stockStatus,
      user,
    );

    return Response.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar estoque.";

    return Response.json({ message }, { status: errorStatus(error) });
  }
}
