import { getPurchaseOrder } from "@/lib/purchase-orders/service";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/purchase-orders/[id]">,
) {
  const { id } = await context.params;

  try {
    const order = await getPurchaseOrder(id);

    if (!order) {
      return Response.json(
        { message: "Pedido não encontrado." },
        { status: 404 },
      );
    }

    return Response.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar pedido.";

    return Response.json({ message }, { status: 400 });
  }
}
