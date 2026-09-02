import {
  Button,
  ComboBox,
  I18nProvider,
  Input,
  Label,
  ListBox,
  NumberField,
  TextField,
  toast,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { type UseFieldArrayAppend, useFormContext } from "react-hook-form";
import type { VirtualStock } from "@/app/services/product/types";
import { FilterBar, SectionHeading } from "@/components/ui/page";
import type { BoxType, PurchaseOrderFormValues } from "@/schemas/purchaseOrder";
import { FULL_BOX_SIZE } from "@/types/products/constants";

interface ProductStatingProps {
  products: VirtualStock[];
  append: UseFieldArrayAppend<PurchaseOrderFormValues, "items">;
}

const ProductStaging = ({ products, append }: ProductStatingProps) => {
  const {
    getValues,
    formState: { errors },
  } = useFormContext<PurchaseOrderFormValues>();

  const [stagedProductId, setStagedProductId] = useState<number | null>(null);
  const [stagedBoxType, setStagedBoxType] = useState<BoxType>("FULL");
  const [stagedQuantity, setStagedQuantity] = useState(1);
  const [stagedPrice, setStagedPrice] = useState(0);

  useEffect(() => {
    const product = products.find((item) => item.id === stagedProductId);

    if (product) {
      setStagedPrice(product.defaultPricePerKg);
      setStagedBoxType(product.boxSize === FULL_BOX_SIZE ? "FULL" : "HALF");
    }
  }, [stagedProductId, products]);

  const handleAddItem = () => {
    if (!stagedProductId || stagedQuantity <= 0 || stagedPrice <= 0) {
      return;
    }

    const currentItems = getValues("items") || [];
    const alreadyHasProduct = currentItems.some(
      (prod) => prod.productId === stagedProductId,
    );

    if (alreadyHasProduct) {
      toast("O produto já está inserido no pedido");
    } else {
      append({
        id: crypto.randomUUID(),
        productId: stagedProductId,
        boxType: stagedBoxType,
        quantity: stagedQuantity,
        customPricePerKg: stagedPrice,
      });
    }

    setStagedProductId(null);
    setStagedBoxType("FULL");
    setStagedQuantity(1);
    setStagedPrice(0);
  };

  return (
    <div>
      <SectionHeading
        description="Inclua produtos, caixas, quantidades e preço por quilo."
        title="Itens do pedido"
      />

      <FilterBar className="mb-5 flex flex-wrap items-end gap-4">
        {/* Product Selection */}
        <ComboBox
          className="min-w-[220px] flex-1"
          onSelectionChange={(key) =>
            setStagedProductId(key ? Number(key.toString()) : null)
          }
          selectedKey={stagedProductId ? stagedProductId.toString() : null}
        >
          <Label>Produto</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Buscar produto..." />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox items={products}>
              {(product) => (
                <ListBox.Item
                  id={product.id.toString()}
                  key={product.id}
                  textValue={product.name}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-xs text-muted">
                      Disponível: {product.available}
                    </span>
                  </div>
                </ListBox.Item>
              )}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>

        {/* Box Size (Read Only based on Product) */}
        <TextField className="w-36" isDisabled>
          <Label>Tamanho (Cx)</Label>
          <Input
            placeholder="-"
            value={
              !stagedProductId
                ? ""
                : stagedBoxType === "HALF"
                  ? "11.34kg (Meia)"
                  : "22.68kg (Completa)"
            }
            variant="secondary"
          />
        </TextField>

        {/* Quantity */}
        <NumberField
          className="w-32"
          minValue={1}
          onChange={(value) => setStagedQuantity(value || 1)}
          value={stagedQuantity}
        >
          <Label>Quantidade</Label>
          <NumberField.Group className="w-full">
            <NumberField.DecrementButton />
            <NumberField.Input className="w-full" />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>

        {/* Custom Price */}
        <div className="flex min-w-[220px] flex-1 flex-col gap-2">
          <I18nProvider locale="pt-BR">
            <NumberField
              className="w-full"
              commitBehavior="validate"
              formatOptions={{ style: "currency", currency: "BRL" }}
              onChange={(value) => setStagedPrice(value ?? 0)}
              step={0.01}
              value={stagedPrice}
            >
              <Label>Preço (kg)</Label>
              <NumberField.Group className="flex w-full">
                <NumberField.Input className="w-full flex-1" />
              </NumberField.Group>
            </NumberField>
          </I18nProvider>
        </div>

        <Button
          type="button"
          isDisabled={
            !stagedProductId || stagedQuantity <= 0 || stagedPrice <= 0
          }
          onPress={handleAddItem}
          variant="primary"
        >
          Adicionar
        </Button>
      </FilterBar>

      {errors.items && (
        <p className="mb-4 text-sm font-medium text-danger">
          {errors.items?.message}
        </p>
      )}
    </div>
  );
};

export default ProductStaging;
