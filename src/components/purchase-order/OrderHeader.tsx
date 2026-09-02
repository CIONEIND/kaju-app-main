import { Alert, Button } from "@heroui/react";
import { LoaderCircle } from "lucide-react";

interface OrderHeaderProps {
  isEditing: boolean;
  orderNumber: number | null;
  isSaving: boolean;
  isLoading: boolean;
  requiresAuthorization: boolean;
  onCancel: () => void;
}

const OrderHeader = ({
  isEditing,
  orderNumber,
  isSaving,
  isLoading,
  requiresAuthorization,
  onCancel,
}: OrderHeaderProps) => {
  return (
    <div className="flex flex-col gap-5 border-b border-border pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-muted">
            Comercial
          </p>
          <h1 className="text-2xl font-semibold">
            {isEditing ? "Editar pedido" : "Novo pedido"}
          </h1>
          {orderNumber ? (
            <p className="mt-1 text-sm text-muted">Pedido #{orderNumber}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onPress={onCancel} variant="tertiary">
            Voltar
          </Button>
          <Button
            isDisabled={isLoading || isSaving}
            type="submit"
            variant="primary"
          >
            {isSaving ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Salvando
              </>
            ) : (
              "Salvar pedido"
            )}
          </Button>
        </div>
      </div>

      {requiresAuthorization && (
        <Alert
          className="animate-in fade-in zoom-in-95 border border-amber-200 bg-amber-50 text-amber-900 duration-300"
          status="warning"
        >
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Revisão necessária</Alert.Title>
            <Alert.Description>
              Este pedido contém itens abaixo do preço mínimo. Revise os valores
              antes de confirmar o pedido.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}
    </div>
  );
};

export default OrderHeader;
