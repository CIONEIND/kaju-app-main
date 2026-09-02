import {
  listPurchaseOrders,
  savePurchaseOrder,
} from "@/lib/purchase-orders/service";

export async function GET() {
  try {
    const orders = await listPurchaseOrders();

    return Response.json(orders);
  } catch (error) {
    console.log(error)
    const message =
      error instanceof Error ? error.message : "Erro ao carregar pedidos.";

    return Response.json({ message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const order = await savePurchaseOrder(payload);

    return Response.json(order);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Erro ao salvar pedido.";

    return Response.json({ message }, { status: 400 });
  }
}
