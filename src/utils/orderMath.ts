import { BOX_WEIGHTS, BoxType } from "@/schemas/purchaseOrder";
import { VirtualStock } from "@/app/services/product/types";

interface CalcItem {
  productId: number;
  quantity: number;
  boxType: BoxType;
  customPricePerKg: number;
}

interface CalculateTotalsParams {
  items: CalcItem[];
  products: VirtualStock[];
  discount: number;
  freight: number;
  isPickup: boolean;
}

export function calculateOrderTotals({
  items,
  products,
  discount,
  freight,
  isPickup,
}: CalculateTotalsParams) {
  let totalWeight = 0;
  let subtotal = 0;
  let requiresAuthorization = false;

  items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;

    const itemWeight = item.quantity * BOX_WEIGHTS[item.boxType];
    totalWeight += itemWeight;
    subtotal += itemWeight * item.customPricePerKg;

    if (item.customPricePerKg < product.minPricePerKg) {
      requiresAuthorization = true;
    }
  });

  const freightCost = isPickup ? 0 : freight;
  const discountAmount = subtotal * (discount / 100);
  const finalTotalPrice = Math.max(0, subtotal + freightCost - discountAmount);

  return {
    totalWeight,
    subtotal,
    discountAmount,
    finalTotalPrice,
    requiresAuthorization,
  };
}