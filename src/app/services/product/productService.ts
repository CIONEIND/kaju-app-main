"use server";

import type {
  ProductWithMinPrice,
  ProductWithPriceAndQty,
  RawProductResult,
  VirtualStock,
} from "@/app/services/product/types";
import { prisma } from "@/lib/prisma";
import { STOCK_STATUS } from "@/lib/purchase-orders/constants";
import { requireAnyPermission, requirePermission } from "@/lib/rbac/access";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { topManagerProducao } from "@/lib/top-manager/db/knex-top-manager-producao";

// Building blocks lidos por mais de uma feature (estoque e criação de pedido),
// por isso `requireAnyPermission`.
const STOCK_OR_ORDER = [PERMISSIONS.STOCK_VIEW, PERMISSIONS.ORDERS_SAVE];
const ORDER_ANY = [PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_SAVE];

export async function getStockPosition(): Promise<ProductWithPriceAndQty[]> {
  await requireAnyPermission(STOCK_OR_ORDER);
  const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const results = await topManagerProducao
    .with("Produtos", (qb) => {
      qb.select(
        "Obj.CdObj",
        "Obj.NmObj",
        "subCategoria.NmObj as subCatName",
        "categoria.NmObj as catName",
      )
        .from("TbObj as Obj")
        .join("TbArvObj as ArvObj", function () {
          this.on("ArvObj.CdObjFil", "=", "Obj.CdObj").andOn(
            "ArvObj.CdObj",
            "=",
            topManagerProducao.raw("?", [1902]),
          );
        })
        .leftJoin("TbObj as subCategoria", "subCategoria.CdObj", "obj.CdObjLin")
        .leftJoin(
          "TbObj as categoria",
          "categoria.CdObj",
          "subCategoria.CdObjMae",
        )
        .whereNotNull("Obj.CdObjLin")
        .where("Obj.TpObj", 4)
        .andWhere("subCategoria.CdObj", "!=", "28169");
    })
    .select<RawProductResult[]>(
      "T.CdObj as id",
      "T.NmObj as name",
      "T.subCatName as subCategory", // 2. Select them here from your CTE ("T")
      "T.catName as category",
      topManagerProducao.raw(
        "CAST(ISNULL(SUM((L.TpLetSin - 2) * L.QtLet), 0) AS DECIMAL(19, 0)) as stockQty",
      ),
    )
    .from("Produtos as T")
    .leftJoin("TbLet as L", function () {
      this.on("L.CdObj", "=", "T.CdObj")
        .andOn("L.CdUne", "=", topManagerProducao.raw("?", [21]))
        .andOn("L.CdCcs", "=", topManagerProducao.raw("?", [137]))
        .andOn("L.CdTdo001", "=", topManagerProducao.raw("?", [2]))
        .andOn("L.DtLet", "<=", topManagerProducao.raw("?", [currentDate]));
    })
    .groupBy("T.CdObj", "T.NmObj", "T.subCatName", "T.catName")
    .orderBy("stockQty", "desc");

  return results.map((row) => ({
    id: row.id, // Convert numeric DB ID to string for React keys
    name: row.name, // TypeScript knows this is a string
    subCategoria: row.subCategory,
    categoria: row.category,
    stockQty: Number(row.stockQty), // Safely cast the SQL decimal/string to a strict JS Number
    minPricePerKg: 0, // Placeholder until you join your pricing table
    defaultPricePerKg: 0, // Placeholder until you join your pricing table
    boxSize:
      row.name.includes("11,34") || row.name.includes("11.34") ? 11.34 : 22.68,
  }));
}

export async function getSockPositionWithReservations(): Promise<
  VirtualStock[]
> {
  await requireAnyPermission(STOCK_OR_ORDER);
  const physicalStockData = await getStockPosition();

  const reservations = await prisma.purchaseOrderItem.groupBy({
    by: ["productId"],
    where: {
      purchaseOrder: {
        stockStatus: STOCK_STATUS.reserved,
      },
    },
    _sum: {
      quantity: true,
    },
  });

  const reservationMap = new Map<number, number>(
    reservations.map((r) => [r.productId, Number(r._sum.quantity || 0)]),
  );

  return physicalStockData.map((product) => {
    const productId = product.id;

    const physicalQty = product.stockQty;
    const reservedQty = reservationMap.get(productId) || 0;
    const availableQty = physicalQty - reservedQty;

    return {
      id: productId,
      name: product.name,
      subCategoria: product.subCategoria,
      categoria: product.categoria,
      physicalStock: physicalQty,
      reserved: reservedQty,
      available: availableQty,
      minPricePerKg: 0, // Placeholder until you join your pricing table
      defaultPricePerKg: 0, // Placeholder until you join your pricing table
      boxSize:
        product.name.includes("11,34") || product.name.includes("11.34")
          ? 11.34
          : 22.68,
    };
  });
}

export interface ProductReservation {
  orderId: string;
  orderNumber: number;
  orderDate: string;
  clientName: string;
  boxType: string;
  quantity: number;
}

export async function getProductReservations(
  productId: number,
): Promise<ProductReservation[]> {
  await requirePermission(PERMISSIONS.STOCK_VIEW);
  const items = await prisma.purchaseOrderItem.findMany({
    where: {
      productId,
      purchaseOrder: { stockStatus: STOCK_STATUS.reserved },
    },
    include: {
      purchaseOrder: {
        select: { id: true, number: true, date: true, clientName: true },
      },
    },
    orderBy: { purchaseOrder: { date: "asc" } },
  });

  return items.map((item) => ({
    orderId: item.purchaseOrder.id,
    orderNumber: item.purchaseOrder.number,
    orderDate: item.purchaseOrder.date.toISOString().slice(0, 10),
    clientName: item.purchaseOrder.clientName,
    boxType: item.boxType,
    quantity: item.quantity,
  }));
}

export async function getEnabledProducts(): Promise<ProductWithMinPrice[]> {
  await requireAnyPermission(ORDER_ANY);
  const results = await topManagerProducao
    .select<RawProductResult[]>("Obj.CdObj as id", "Obj.NmObj as name")
    .from("TbObj as Obj")
    .join("TbArvObj as ArvObj", function () {
      this.on("ArvObj.CdObjFil", "=", "Obj.CdObj").andOn(
        "ArvObj.CdObj",
        "=",
        topManagerProducao.raw("?", [1902]),
      );
    })
    .whereNotNull("Obj.CdObjLin")
    .where("Obj.TpObj", 4)
    .orderBy("Obj.NmObj", "asc");

  return results.map((row) => ({
    id: row.id, // Convert numeric DB ID to string for React keys
    name: row.name, // TypeScript knows this is a string
    minPricePerKg: 0, // Placeholder until you join your pricing table
    boxSize:
      row.name.includes("11,34") || row.name.includes("11.34") ? 11.34 : 22.68,
  }));
}
