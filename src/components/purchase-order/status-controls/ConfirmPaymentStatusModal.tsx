"use client";

import { Button, Modal, type UseOverlayStateReturn } from "@heroui/react";

interface ConfirmPaymentStatusModalProps {
  state: UseOverlayStateReturn;
  orderNumber: number;
  statusLabel: string;
  isLoading: boolean;
  onConfirm: () => void;
}

export function ConfirmPaymentStatusModal({
  state,
  orderNumber,
  statusLabel,
  isLoading,
  onConfirm,
}: ConfirmPaymentStatusModalProps) {
  return (
    <Modal state={state}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Confirmar pagamento?</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                Deseja alterar o pagamento do pedido #{orderNumber} para{" "}
                {statusLabel}?
              </p>
            </Modal.Header>
            <Modal.Footer>
              <Button
                isDisabled={isLoading}
                onPress={state.close}
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                isDisabled={isLoading}
                onPress={onConfirm}
                variant="primary"
              >
                Confirmar pagamento
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
