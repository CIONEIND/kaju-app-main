import { getAllClients } from "@/app/services/client/clientService";
import { getEnabledProducts } from "@/app/services/product/productService";
import type { ProductWithMinPrice } from "@/app/services/product/types";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  type PurchaseOrderUser,
  requirePurchaseOrderUser,
} from "@/lib/purchase-orders/auth";
import {
  FINANCIAL_STATUS,
  isPurchaseOrderFinancialStatus,
  isPurchaseOrderOrderStatus,
  isPurchaseOrderStockStatus,
  ORDER_STATUS,
  type PurchaseOrderFinancialStatus,
  type PurchaseOrderOrderStatus,
  type PurchaseOrderStockStatus,
  STOCK_STATUS,
} from "@/lib/purchase-orders/constants";
import { withdrawPurchaseOrderStock } from "@/lib/purchase-orders/stock-withdrawal-client";
import { requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import {
  BOX_WEIGHTS,
  type PurchaseOrderFormValues,
  purchaseOrderSchema,
} from "@/schemas/purchaseOrder";
import {
  FULL_BOX_SIZE,
  FULL_BOX_SIZE_LABEL,
  HALF_BOX_SIZE_LABEL,
} from "@/types/products/constants";

type SavePurchaseOrderInput = PurchaseOrderFormValues & {
  id?: string;
};

const purchaseOrderInclude = {
  audits: {
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },
  items: {
    orderBy: {
      createdAt: "asc",
    },
  },
} as const satisfies Prisma.PurchaseOrderInclude;

type PurchaseOrderWithRelations = Prisma.PurchaseOrderGetPayload<{
  include: typeof purchaseOrderInclude;
}>;

function asNumber(value: Prisma.Decimal | number | string) {
  return Number(value);
}

function formatAuditDetails(details: Prisma.JsonValue) {
  if (typeof details === "string") {
    return details;
  }

  if (details && typeof details === "object") {
    return JSON.stringify(details);
  }

  return "";
}

async function resolveUser(user?: PurchaseOrderUser) {
  return user ?? requirePurchaseOrderUser();
}

async function requireKnownClient(clientId: string) {
  const clients = await getAllClients();
  const client = clients.find(
    (item) => item.codCliente.toString() === clientId,
  );

  if (!client) {
    throw new Error("Cliente inválido.");
  }

  return client;
}

function requireKnownProduct(
  productId: number,
  products: ProductWithMinPrice[],
) {
  const product = products.find((item) => item.id === productId);

  if (!product) {
    throw new Error("Produto inválido.");
  }

  return {
    ...product,
    boxType:
      product.boxSize === FULL_BOX_SIZE
        ? FULL_BOX_SIZE_LABEL
        : HALF_BOX_SIZE_LABEL,
  };
}

async function buildSnapshot(input: PurchaseOrderFormValues) {
  const data = purchaseOrderSchema.parse(input);
  const client = await requireKnownClient(data.clientId);
  const products = await getEnabledProducts();

  let subtotal = 0;
  let totalWeightKg = 0;

  const items = data.items.map((item) => {
    requireKnownProduct(item.productId, products);
    const boxWeightKg = BOX_WEIGHTS[item.boxType];
    const itemWeightKg = item.quantity * boxWeightKg;
    const itemTotal = itemWeightKg * item.customPricePerKg;

    subtotal += itemTotal;
    totalWeightKg += itemWeightKg;

    return {
      id: item.id,
      productId: item.productId,
      boxType: item.boxType,
      boxWeightKg,
      quantity: item.quantity,
      pricePerKg: item.customPricePerKg,
      totalWeightKg: itemWeightKg,
      totalPrice: itemTotal,
    };
  });

  const freight =
    data.isPickup || data.freightType !== "fob" ? 0 : data.freight;
  const discountAmount = subtotal * (data.discount / 100);
  const totalPrice = Math.max(0, subtotal + freight - discountAmount);

  return {
    client,
    data,
    discountAmount,
    freight,
    items,
    subtotal,
    totalPrice,
    totalWeightKg,
  };
}

function serializePurchaseOrder(order: PurchaseOrderWithRelations) {
  return {
    id: order.id,
    number: order.number,
    date: order.date.toISOString().slice(0, 10),
    clientId: order.clientId,
    clientName: order.clientName,
    clientCnpj: order.clientCnpj?.toString(),
    paymentWay: order.paymentWay,
    paymentTerms: order.paymentTerms,
    isPickup: order.isPickup,
    freightType: order.freightType,
    freight: asNumber(order.freight),
    discount: asNumber(order.discountPercent),
    discountAmount: asNumber(order.discountAmount),
    subtotal: asNumber(order.subtotal),
    totalWeight: asNumber(order.totalWeightKg),
    totalPrice: asNumber(order.totalPrice),
    orderStatus: order.orderStatus as PurchaseOrderOrderStatus,
    financialStatus: order.financialStatus as PurchaseOrderFinancialStatus,
    stockStatus: order.stockStatus as PurchaseOrderStockStatus,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      boxType: item.boxType,
      quantity: item.quantity,
      customPricePerKg: asNumber(item.pricePerKg),
      boxWeightKg: asNumber(item.boxWeightKg),
      totalWeight: asNumber(item.totalWeightKg),
      totalPrice: asNumber(item.totalPrice),
    })),
    audits: order.audits.map((audit) => ({
      id: audit.id,
      action: audit.action,
      createdAt: audit.createdAt.toISOString(),
      details: formatAuditDetails(audit.details),
      user: audit.user?.name ?? audit.user?.email ?? "Sistema",
    })),
  };
}

function serializePurchaseOrderSummary(order: PurchaseOrderWithRelations) {
  const serialized = serializePurchaseOrder(order);

  return {
    id: serialized.id,
    number: serialized.number,
    date: serialized.date,
    clientName: serialized.clientName,
    orderStatus: serialized.orderStatus,
    financialStatus: serialized.financialStatus,
    stockStatus: serialized.stockStatus,
    totalWeightKg: serialized.totalWeight,
    boxes: serialized.items.reduce((total, item) => total + item.quantity, 0),
    totalPrice: serialized.totalPrice,
    items: serialized.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      boxType: item.boxType,
      quantity: item.quantity,
      pricePerKg: item.customPricePerKg,
      totalWeight: item.totalWeight,
      totalPrice: item.totalPrice,
    })),
    audits: serialized.audits.map((audit) => ({
      id: audit.id,
      date: audit.createdAt,
      user: audit.user,
      action: audit.action,
      details: audit.details,
    })),
  };
}

function buildUpdateDetails(
  existing: Awaited<ReturnType<typeof prisma.purchaseOrder.findUniqueOrThrow>>,
  incomingItemIds: string[],
) {
  return {
    previousOrderStatus: existing.orderStatus,
    previousFinancialStatus: existing.financialStatus,
    previousStockStatus: existing.stockStatus,
    submittedItemIds: incomingItemIds,
  };
}

async function findOrderWithRelations(
  id: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  return tx.purchaseOrder.findUniqueOrThrow({
    where: { id },
    include: purchaseOrderInclude,
  });
}

function assertOperationalOrder(orderStatus: string) {
  if (orderStatus !== ORDER_STATUS.confirmed) {
    throw new Error("Apenas pedidos confirmados permitem alterar este status.");
  }
}

export async function getPurchaseOrder(id: string) {
  await requirePermission(PERMISSIONS.ORDERS_VIEW);

  const [order, products] = await Promise.all([
    prisma.purchaseOrder.findUnique({
      where: { id },
      include: purchaseOrderInclude,
    }),
    getEnabledProducts(),
  ]);

  if (!order) return null;

  const productMap = new Map(products.map((p) => [p.id, p.name]));
  const serialized = serializePurchaseOrder(order);

  return {
    ...serialized,
    items: serialized.items.map((item) => ({
      ...item,
      productName: productMap.get(item.productId) ?? null,
    })),
  };
}

export async function listPurchaseOrders() {
  await requirePermission(PERMISSIONS.ORDERS_VIEW);

  const [orders, products] = await Promise.all([
    prisma.purchaseOrder.findMany({
      include: purchaseOrderInclude,
      orderBy: [{ date: "desc" }, { number: "desc" }],
    }),
    getEnabledProducts(),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p.name]));

  return orders.map((order) => {
    const summary = serializePurchaseOrderSummary(order);
    return {
      ...summary,
      items: summary.items.map((item) => ({
        ...item,
        productName: productMap.get(item.productId) ?? null,
      })),
    };
  });
}

export async function savePurchaseOrder(input: SavePurchaseOrderInput) {
  // Criar e editar são a mesma permissão: orders:save.
  const access = await requirePermission(PERMISSIONS.ORDERS_SAVE);
  const user: PurchaseOrderUser = { id: access.id };
  const snapshot = await buildSnapshot(input);

  const order = await prisma.$transaction(async (tx) => {
    if (!input.id) {
      return tx.purchaseOrder.create({
        data: {
          date: new Date(`${snapshot.data.date}T00:00:00Z`),
          clientId: snapshot.client.codCliente.toString(),
          clientName: snapshot.client.nome,
          clientCnpj: snapshot.client.cpfCnpj?.toString(),
          paymentWay: snapshot.data.paymentWay,
          paymentTerms: snapshot.data.paymentTerms,
          isPickup: snapshot.data.isPickup,
          freightType: snapshot.data.isPickup
            ? null
            : snapshot.data.freightType,
          freight: snapshot.freight,
          discountPercent: snapshot.data.discount,
          discountAmount: snapshot.discountAmount,
          subtotal: snapshot.subtotal,
          totalWeightKg: snapshot.totalWeightKg,
          totalPrice: snapshot.totalPrice,
          orderStatus: ORDER_STATUS.draft,
          financialStatus: FINANCIAL_STATUS.awaitingPayment,
          stockStatus: STOCK_STATUS.notReserved,
          createdBy: {
            connect: { id: user.id },
          },
          updatedBy: {
            connect: { id: user.id },
          },
          items: {
            create: snapshot.items,
          },
          audits: {
            create: {
              action: "created",
              details: {
                orderStatus: ORDER_STATUS.draft,
                financialStatus: FINANCIAL_STATUS.awaitingPayment,
                stockStatus: STOCK_STATUS.notReserved,
                totalPrice: snapshot.totalPrice,
              },
              user: {
                connect: { id: user.id },
              },
            },
          },
        },
        include: purchaseOrderInclude,
      });
    }

    const existing = await tx.purchaseOrder.findUniqueOrThrow({
      where: { id: input.id },
      include: {
        items: true,
      },
    });

    const incomingIds = snapshot.items.map((item) => item.id);
    const existingIds = existing.items.map((item) => item.id);
    const deletedItemIds = existingIds.filter(
      (id) => !incomingIds.includes(id),
    );
    const createdItemIds = incomingIds.filter(
      (id) => !existingIds.includes(id),
    );
    const updatedItemIds = incomingIds.filter((id) => existingIds.includes(id));

    await tx.purchaseOrderItem.deleteMany({
      where: {
        purchaseOrderId: input.id,
        id: {
          notIn: incomingIds,
        },
      },
    });

    for (const item of snapshot.items) {
      if (existingIds.includes(item.id)) {
        await tx.purchaseOrderItem.updateMany({
          data: item,
          where: {
            id: item.id,
            purchaseOrderId: input.id,
          },
        });
        continue;
      }

      await tx.purchaseOrderItem.create({
        data: {
          ...item,
          purchaseOrderId: input.id,
        },
      });
    }

    await tx.purchaseOrder.update({
      data: {
        date: new Date(`${snapshot.data.date}T00:00:00Z`),
        clientId: snapshot.client.codCliente.toString(),
        clientName: snapshot.client.nome,
        clientCnpj: snapshot.client.cpfCnpj?.toString(),
        paymentWay: snapshot.data.paymentWay,
        paymentTerms: snapshot.data.paymentTerms,
        isPickup: snapshot.data.isPickup,
        freightType: snapshot.data.isPickup ? null : snapshot.data.freightType,
        freight: snapshot.freight,
        discountPercent: snapshot.data.discount,
        discountAmount: snapshot.discountAmount,
        subtotal: snapshot.subtotal,
        totalWeightKg: snapshot.totalWeightKg,
        totalPrice: snapshot.totalPrice,
        updatedBy: {
          connect: { id: user.id },
        },
        audits: {
          create: {
            action: "updated",
            details: {
              ...buildUpdateDetails(existing, incomingIds),
              createdItemIds,
              deletedItemIds,
              totalPrice: snapshot.totalPrice,
              updatedItemIds,
            },
            user: {
              connect: { id: user.id },
            },
          },
        },
      },
      where: { id: input.id },
    });

    return findOrderWithRelations(input.id, tx);
  });

  return serializePurchaseOrder(order);
}

export async function updatePurchaseOrderOrderStatus(
  id: string,
  orderStatus: PurchaseOrderOrderStatus,
  user?: PurchaseOrderUser,
) {
  await requirePermission(PERMISSIONS.ORDERS_UPDATE_STATUS);
  const activeUser = await resolveUser(user);

  if (!isPurchaseOrderOrderStatus(orderStatus)) {
    throw new Error("Status do pedido inválido.");
  }

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.purchaseOrder.findUniqueOrThrow({
      where: { id },
    });

    if (existing.orderStatus === ORDER_STATUS.canceled) {
      throw new Error("Pedidos cancelados não podem mudar de status.");
    }

    if (
      existing.orderStatus === ORDER_STATUS.confirmed &&
      orderStatus === ORDER_STATUS.draft
    ) {
      throw new Error("Pedidos confirmados não podem voltar para rascunho.");
    }

    await tx.purchaseOrder.update({
      data: {
        orderStatus,
        updatedBy: {
          connect: { id: activeUser.id },
        },
        audits: {
          create: {
            action: "status_changed",
            details: {
              axis: "order",
              from: existing.orderStatus,
              to: orderStatus,
            },
            user: {
              connect: { id: activeUser.id },
            },
          },
        },
      },
      where: { id },
    });

    return findOrderWithRelations(id, tx);
  });

  return serializePurchaseOrderSummary(order);
}

export async function updatePurchaseOrderFinancialStatus(
  id: string,
  financialStatus: PurchaseOrderFinancialStatus,
  user?: PurchaseOrderUser,
) {
  await requirePermission(PERMISSIONS.ORDERS_UPDATE_STATUS);
  const activeUser = await resolveUser(user);

  if (!isPurchaseOrderFinancialStatus(financialStatus)) {
    throw new Error("Status financeiro inválido.");
  }

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.purchaseOrder.findUniqueOrThrow({
      where: { id },
    });

    assertOperationalOrder(existing.orderStatus);

    await tx.purchaseOrder.update({
      data: {
        financialStatus,
        updatedBy: {
          connect: { id: activeUser.id },
        },
        audits: {
          create: {
            action: "status_changed",
            details: {
              axis: "financial",
              from: existing.financialStatus,
              to: financialStatus,
            },
            user: {
              connect: { id: activeUser.id },
            },
          },
        },
      },
      where: { id },
    });

    return findOrderWithRelations(id, tx);
  });

  return serializePurchaseOrderSummary(order);
}

export async function updatePurchaseOrderStockStatus(
  id: string,
  stockStatus: PurchaseOrderStockStatus,
  user?: PurchaseOrderUser,
) {
  await requirePermission(PERMISSIONS.ORDERS_UPDATE_STATUS);
  const activeUser = await resolveUser(user);

  if (!isPurchaseOrderStockStatus(stockStatus)) {
    throw new Error("Status de estoque inválido.");
  }

  const existing = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id },
    include: {
      items: true,
    },
  });

  assertOperationalOrder(existing.orderStatus);

  let externalReference: string | undefined;

  if (stockStatus === STOCK_STATUS.withdrawn) {
    const result = await withdrawPurchaseOrderStock({
      orderId: existing.id,
      orderNumber: existing.number,
      stockStatus,
    });

    if (!result.success) {
      throw new Error("Não foi possível registrar a retirada da mercadoria.");
    }

    externalReference = result.externalReference;
  }

  const order = await prisma.$transaction(async (tx) => {
    const current = await tx.purchaseOrder.findUniqueOrThrow({ where: { id } });

    assertOperationalOrder(current.orderStatus);

    await tx.purchaseOrder.update({
      data: {
        stockStatus,
        updatedBy: {
          connect: { id: activeUser.id },
        },
        audits: {
          create: {
            action: "status_changed",
            details: {
              axis: "stock",
              from: current.stockStatus,
              to: stockStatus,
              externalReference,
            },
            user: {
              connect: { id: activeUser.id },
            },
          },
        },
      },
      where: { id },
    });

    return findOrderWithRelations(id, tx);
  });

  return serializePurchaseOrderSummary(order);
}
