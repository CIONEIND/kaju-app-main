"use client";

import { Button, Modal, type UseOverlayStateReturn } from "@heroui/react";

interface ReserveStockPromptModalProps {
  state: UseOverlayStateReturn;
  orderNumber: number;
  isLoading: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}

export function ReserveStockPromptModal({
  state,
  orderNumber,
  isLoading,
  onConfirm,
  onDecline,
}: ReserveStockPromptModalProps) {
  return (
    <Modal state={state}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Reservar estoque?</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                Ao marcar o pedido #{orderNumber} como pago, deseja reservar o
                estoque também?
              </p>
            </Modal.Header>
            <Modal.Footer>
              <Button
                isDisabled={isLoading}
                onPress={onDecline}
                variant="secondary"
              >
                Não reservar
              </Button>
              <Button
                isDisabled={isLoading}
                onPress={onConfirm}
                variant="primary"
              >
                Reservar estoque
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
