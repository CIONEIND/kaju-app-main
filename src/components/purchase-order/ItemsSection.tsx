import { useFieldArray, useFormContext } from "react-hook-form";
import { PurchaseOrderFormValues } from "@/schemas/purchaseOrder";
import { VirtualStock } from "@/app/services/product/types";
import  ProductStaging from "./ProductStaging";
import  OrderTable  from "./OrderTable";

interface ItemsSectionProps {
  products: VirtualStock[];
  isLoadingProducts: boolean;
}

export function ItemsSection({ products, isLoadingProducts }: ItemsSectionProps) {
  const { control } = useFormContext<PurchaseOrderFormValues>();

  // Call this ONLY ONCE here
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  return (
    <div>
      <ProductStaging 
        products={products} 
        append={append} 
      />
      <OrderTable 
        products={products} 
        isLoadingProducts={isLoadingProducts} 
        fields={fields} 
        remove={remove} 
      />
    </div>
  );
}