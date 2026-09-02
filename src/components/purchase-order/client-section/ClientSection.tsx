import {
  Autocomplete,
  EmptyState,
  FieldError,
  Input,
  Label,
  ListBox,
  SearchField,
  TextField,
} from "@heroui/react";
import { useDeferredValue, useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { ClienteMercadoDTO } from "@/app/services/client/types";
import { SectionHeading } from "@/components/ui/page";
import type { PurchaseOrderFormValues } from "@/schemas/purchaseOrder";

interface ClientSectionProps {
  clients: ClienteMercadoDTO[];
  orderNumber: number | null;
}

const ClientSection = ({ clients, orderNumber }: ClientSectionProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<PurchaseOrderFormValues>();

  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(clientSearchQuery);

  const filteredClients = useMemo(() => {
    if (!deferredSearchQuery.trim()) return clients.slice(0, 20);
    const q = deferredSearchQuery.toUpperCase();
    return clients
      .filter(
        (client) =>
          client.nome.toUpperCase().includes(q) ||
          client.cpfCnpj?.toString()?.toUpperCase()?.includes(q),
      )
      .slice(0, 50);
  }, [clients, deferredSearchQuery]);

  return (
    <div>
      <SectionHeading
        description="Identifique o cliente e a data base do pedido."
        title="Pedido e cliente"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <TextField className="w-full" isDisabled>
          <Label>Nº do Pedido</Label>
          <Input
            placeholder={
              orderNumber ? String(orderNumber) : "Gerado automaticamente"
            }
            variant="secondary"
          />
        </TextField>

        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <TextField className="w-full" isInvalid={!!errors.date}>
              <Label>Data de Emissao</Label>
              <Input {...field} type="date" variant="secondary" />
              {errors.date && <FieldError>{errors.date.message}</FieldError>}
            </TextField>
          )}
        />

        {/* Client Selection */}
        <div className="md:col-span-2">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <Controller
              control={control}
              name="clientId"
              render={({ field }) => (
                <Autocomplete
                  placeholder="Selecione um cliente"
                  className="w-full"
                  isInvalid={!!errors.clientId}
                  onChange={field.onChange}
                  value={field.value}
                  variant="secondary"
                >
                  <Label>Cliente</Label>
                  <Autocomplete.Trigger>
                    <Autocomplete.Value>
                      {({ defaultChildren, state }) => {
                        const client = clients.find(
                          (item) => item.codCliente === state.selectedKey,
                        );
                        return client ? client.nome : defaultChildren;
                      }}
                    </Autocomplete.Value>
                    <Autocomplete.ClearButton />
                    <Autocomplete.Indicator />
                  </Autocomplete.Trigger>
                  <Autocomplete.Popover>
                    <Autocomplete.Filter
                      inputValue={clientSearchQuery}
                      onInputChange={setClientSearchQuery}
                    >
                      <SearchField autoFocus name="search" variant="secondary">
                        <SearchField.Group>
                          <SearchField.SearchIcon />
                          <SearchField.Input placeholder="Buscar por nome ou CNPJ..." />
                          <SearchField.ClearButton />
                        </SearchField.Group>
                      </SearchField>
                      <ListBox
                        items={filteredClients}
                        renderEmptyState={() => (
                          <EmptyState>
                            Nenhum cliente encontrado.
                          </EmptyState>
                        )}
                      >
                        {(client) => (
                          <ListBox.Item
                            id={client.codCliente.toString()}
                            key={client.codCliente}
                            textValue={client.nome}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{client.nome}</span>
                              <span className="text-xs text-muted">
                                {client.cpfCnpj}
                              </span>
                            </div>
                          </ListBox.Item>
                        )}
                      </ListBox>
                    </Autocomplete.Filter>
                  </Autocomplete.Popover>
                  {errors.clientId && (
                    <FieldError>{errors.clientId.message}</FieldError>
                  )}
                </Autocomplete>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSection;
