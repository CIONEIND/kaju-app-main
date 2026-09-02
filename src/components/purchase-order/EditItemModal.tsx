"use client";

import {
  Button,
  I18nProvider,
  Input,
  Label,
  Modal,
  NumberField,
  type UseOverlayStateReturn,
} from "@heroui/react";
import { useState } from "react";
import type { VirtualStock } from "@/app/services/product/types";
import type { BoxType } from "@/schemas/purchaseOrder";
import { formatCurrency } from "@/utils/format";

interface EditItemModalProps {
  state: UseOverlayStateReturn;
  product?: VirtualStock;
  boxType: BoxType;
  initialQuantity: number;
  initialPrice: number;
  onSave: (values: { quantity: number; customPricePerKg: number }) => void;
}

export function EditItemModal({
  state,
  product,
  boxType,
  initialQuantity,
  initialPrice,
  onSave,
}: EditItemModalProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [price, setPrice] = useState(initialPrice);

  const isUnderpriced = product ? price < product.minPricePerKg : false;
  const isOutOfStock = product
    ? product.available < 0 || quantity > product.available
    : false;
  const isValid = quantity >= 1 && price >= 0.01;

  const handleSave = () => {
    if (!isValid) return;
    onSave({ quantity, customPricePerKg: price });
    state.close();
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Editar item</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                {product?.name ?? "Produto"} ·{" "}
                {boxType === "FULL" ? "Caixa 22.68kg" : "Caixa 11.34kg"}
              </p>
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4">
              <NumberField
                minValue={1}
                onChange={(value) => setQuantity(value || 1)}
                value={quantity}
              >
                <Label>Quantidade (caixas)</Label>
                <NumberField.Group className="w-full">
                  <NumberField.DecrementButton />
                  <NumberField.Input className="w-full text-center" />
                  <NumberField.IncrementButton />
                </NumberField.Group>
              </NumberField>

              <I18nProvider locale="pt-BR">
                <NumberField
                  commitBehavior="validate"
                  formatOptions={{ style: "currency", currency: "BRL" }}
                  minValue={0}
                  onChange={(value) => setPrice(value ?? 0)}
                  step={0.01}
                  value={price}
                >
                  <Label>Preço (kg)</Label>
                  <NumberField.Group className="flex w-full">
                    <Input className="w-full flex-1" />
                  </NumberField.Group>
                </NumberField>
              </I18nProvider>

              {(isUnderpriced || isOutOfStock) && (
                <div className="flex flex-col gap-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                  {isUnderpriced && product && (
                    <span>
                      Preço abaixo do mínimo (
                      {formatCurrency(product.minPricePerKg)}/kg). Exigirá
                      autorização.
                    </span>
                  )}
                  {isOutOfStock && product && (
                    <span>
                      Quantidade acima do disponível ({product.available} cx).
                    </span>
                  )}
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button onPress={state.close} variant="secondary">
                Cancelar
              </Button>
              <Button
                isDisabled={!isValid}
                onPress={handleSave}
                variant="primary"
              >
                Salvar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
