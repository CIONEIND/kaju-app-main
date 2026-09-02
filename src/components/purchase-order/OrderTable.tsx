import { Button, Separator, Table, useOverlayState } from "@heroui/react";
import { useMemo, useState } from "react";
import {
  type FieldArrayWithId,
  type UseFieldArrayRemove,
  useFormContext,
  useWatch,
} from "react-hook-form";
import type { VirtualStock } from "@/app/services/product/types";
import { TableSkeleton } from "@/components/ui/loading";
import { ORDER_STATUS } from "@/lib/purchase-orders/constants";
import {
  BOX_WEIGHTS,
  type PurchaseOrderFormValues,
} from "@/schemas/purchaseOrder";
import { formatCurrency, formatWeight } from "@/utils/format";
import { calculateOrderTotals } from "@/utils/orderMath"; // Adjust path as needed
import { EditItemModal } from "./EditItemModal";

interface OrderTableProps {
  products: VirtualStock[];
  isLoadingProducts: boolean;
  fields: FieldArrayWithId<PurchaseOrderFormValues, "items", "id">[];
  remove: UseFieldArrayRemove;
}

export default function OrderTable({
  products,
  isLoadingProducts,
  fields,
  remove,
}: OrderTableProps) {
  const { control, getValues, setValue } =
    useFormContext<PurchaseOrderFormValues>();

  const editState = useOverlayState();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // Bumped on each open so the modal remounts with fresh initial values,
  // even when re-editing the same row after a cancelled edit.
  const [editToken, setEditToken] = useState(0);

  const tableItems = useMemo(() => {
    return fields.map((field, index) => {
      const product = products.find((item) => item.id === field.productId);
      return {
        ...field,
        index,
        product,
        isProductLoading: isLoadingProducts,
      };
    });
  }, [fields, products, isLoadingProducts]);

  const watchedItems = useWatch({ control, name: "items", defaultValue: [] });
  const watchedDiscount = useWatch({
    control,
    name: "discount",
    defaultValue: 0,
  });
  const watchedFreight = useWatch({
    control,
    name: "freight",
    defaultValue: 0,
  });
  const watchedIsPickup = useWatch({
    control,
    name: "isPickup",
    defaultValue: true,
  });
  const watchedFreightType = useWatch({ control, name: "freightType" });

  // Compute the totals using our pure utility function
  const {
    totalWeight,
    subtotal,
    discountAmount,
    finalTotalPrice,
    requiresAuthorization,
  } = useMemo(() => {
    return calculateOrderTotals({
      items: watchedItems,
      products,
      discount: watchedDiscount,
      freight: watchedFreight,
      isPickup: watchedIsPickup,
    });
  }, [
    watchedItems,
    products,
    watchedDiscount,
    watchedFreight,
    watchedIsPickup,
  ]);

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setEditToken((token) => token + 1);
    editState.open();
  };

  const handleSaveEdit = (values: {
    quantity: number;
    customPricePerKg: number;
  }) => {
    if (editingIndex === null) return;
    setValue(`items.${editingIndex}.quantity`, values.quantity, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(
      `items.${editingIndex}.customPricePerKg`,
      values.customPricePerKg,
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const editingField = editingIndex !== null ? fields[editingIndex] : undefined;
  const editingProduct = editingField
    ? products.find((p) => p.id === editingField.productId)
    : undefined;

  const initialOrderStatus = ORDER_STATUS.draft;

  if (isLoadingProducts && fields.length === 0) {
    return <TableSkeleton columns={7} rows={4} />;
  }

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Itens do Pedido">
          <Table.Header>
            <Table.Column id="product" isRowHeader>
              PRODUTO
            </Table.Column>
            <Table.Column className="text-center" id="box">
              CAIXA
            </Table.Column>
            <Table.Column className="text-center" id="qty">
              QTD.
            </Table.Column>
            <Table.Column className="text-center" id="price">
              PREÇO (KG)
            </Table.Column>
            <Table.Column className="text-center" id="weight">
              PESO TOTAL
            </Table.Column>
            <Table.Column className="text-center" id="total">
              SUBTOTAL
            </Table.Column>
            <Table.Column className="text-center" id="action">
              AÇÃO
            </Table.Column>
          </Table.Header>

          <Table.Body
            dependencies={[watchedItems]}
            items={tableItems}
            renderEmptyState={() => (
              <div className="py-8 text-center text-muted">
                Nenhum item adicionado ao pedido ainda.
              </div>
            )}
          >
            {(item) => {
              const { product, isProductLoading, index } = item;

              // Use live (watched) values so edits made in the modal reflect
              // instantly in the computed columns, badges and totals.
              const liveItem = watchedItems[index] ?? item;
              const boxType = liveItem.boxType ?? item.boxType;
              const quantity = liveItem.quantity ?? item.quantity;
              const customPricePerKg =
                liveItem.customPricePerKg ?? item.customPricePerKg;

              const itemWeight = quantity * BOX_WEIGHTS[boxType];
              const itemTotal = itemWeight * customPricePerKg;

              const isUnderpriced = product
                ? customPricePerKg < product.minPricePerKg
                : false;
              const isOutOfStock = product
                ? product.available < 0 || quantity > product.available
                : false;

              const hasError = isUnderpriced || isOutOfStock;

              return (
                <Table.Row
                  className={hasError ? "bg-red-50/70" : ""}
                  key={item.id}
                >
                  <Table.Cell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {isProductLoading
                          ? "Carregando..."
                          : product?.name || "Produto não encontrado"}
                      </span>
                      <div className="flex gap-1">
                        {isUnderpriced && (
                          <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
                            Preço mín.
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
                            Sem estoque
                          </span>
                        )}
                      </div>
                    </div>
                  </Table.Cell>

                  <Table.Cell className="text-center">
                    {boxType === "FULL" ? "22.68kg" : "11.34kg"}
                  </Table.Cell>
                  <Table.Cell className="text-center">{quantity}</Table.Cell>
                  <Table.Cell
                    className={`text-center ${isUnderpriced ? "font-semibold text-danger" : ""}`}
                  >
                    {formatCurrency(customPricePerKg)}
                  </Table.Cell>
                  <Table.Cell
                    className={`text-center ${isOutOfStock ? "font-semibold text-danger" : ""}`}
                  >
                    {formatWeight(itemWeight)}
                  </Table.Cell>
                  <Table.Cell className="text-center font-medium">
                    {formatCurrency(itemTotal)}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-center gap-1">
                      <Button
                        aria-label="Editar item"
                        isIconOnly
                        onPress={() => openEdit(index)}
                        size="sm"
                        variant="secondary"
                      >
                        <svg
                          aria-hidden="true"
                          className="size-4"
                          fill="none"
                          focusable="false"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                          />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                          />
                        </svg>
                      </Button>
                      <Button
                        aria-label="Remover item"
                        isIconOnly
                        onPress={() => remove(index)}
                        size="sm"
                        variant="danger-soft"
                      >
                        <svg
                          aria-hidden="true"
                          className="size-4"
                          fill="none"
                          focusable="false"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M19 7 18.133 19.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                          />
                        </svg>
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            }}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>

      {fields.length > 0 && (
        <Table.Footer className="border-t border-border bg-surface-secondary/50 p-4">
          <div className="ml-auto flex w-full max-w-sm flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Status inicial:</span>
              <span
                className={
                  requiresAuthorization
                    ? "rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800"
                    : "font-medium"
                }
              >
                {initialOrderStatus}
              </span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Frete:</span>
              <span className="font-medium">
                {watchedIsPickup
                  ? "Retirada"
                  : `+${formatCurrency(watchedFreight)} (${(watchedFreightType || "").toUpperCase()})`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Desconto Global:</span>
              <span className="font-medium text-success">
                -{formatCurrency(discountAmount)} ({watchedDiscount.toFixed(2)}
                %)
              </span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-sm">
              <span className="text-muted">Peso Total:</span>
              <span className="font-medium">{formatWeight(totalWeight)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Final:</span>
              <span>{formatCurrency(finalTotalPrice)}</span>
            </div>
          </div>
        </Table.Footer>
      )}

      {editingField && (
        <EditItemModal
          boxType={editingField.boxType}
          initialPrice={
            getValues(`items.${editingIndex as number}.customPricePerKg`) ??
            editingField.customPricePerKg
          }
          initialQuantity={
            getValues(`items.${editingIndex as number}.quantity`) ??
            editingField.quantity
          }
          key={editToken}
          onSave={handleSaveEdit}
          product={editingProduct}
          state={editState}
        />
      )}
    </Table>
  );
}
