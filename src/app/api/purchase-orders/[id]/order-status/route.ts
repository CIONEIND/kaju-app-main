import type { UpdatePurchaseOrderOrderStatusPayload } from "@/lib/purchase-orders/api-types";
import { requirePurchaseOrderUser } from "@/lib/purchase-orders/auth";
import { isPurchaseOrderOrderStatus } from "@/lib/purchase-orders/constants";
import { updatePurchaseOrderOrderStatus } from "@/lib/purchase-orders/service";

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
      (await request.json()) as Partial<UpdatePurchaseOrderOrderStatusPayload>;

    if (!isPurchaseOrderOrderStatus(payload.orderStatus)) {
      return Response.json(
        { message: "Status do pedido é obrigatório." },
        { status: 400 },
      );
    }

    const order = await updatePurchaseOrderOrderStatus(
      id,
      payload.orderStatus,
      user,
    );

    return Response.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar pedido.";

    return Response.json({ message }, { status: errorStatus(error) });
  }
}
