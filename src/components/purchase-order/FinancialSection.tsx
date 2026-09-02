import {
  Checkbox,
  FieldError,
  I18nProvider,
  Input,
  Label,
  ListBox,
  NumberField,
  Select,
  TextField,
} from "@heroui/react";
import { useEffect } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { SectionHeading } from "@/components/ui/page";
import {
  PAYMENT_TERMS,
  type PurchaseOrderFormValues,
} from "@/schemas/purchaseOrder";

const FinancialSection = () => {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<PurchaseOrderFormValues>();

  const watchedIsPickup = useWatch({
    control,
    name: "isPickup",
    defaultValue: true,
  });

  const watchedFreightType = useWatch({
    control,
    name: "freightType",
  });

  useEffect(() => {
    if (!watchedIsPickup) {
      if (watchedFreightType !== "fob") {
        setValue("freight", 0, { shouldValidate: true });
      }
      return;
    }

    setValue("freight", 0, { shouldValidate: true });
    setValue("freightType", undefined, { shouldValidate: true });
  }, [setValue, watchedFreightType, watchedIsPickup]);

  const isFreightDisabled = watchedIsPickup || watchedFreightType !== "fob";

  return (
    <div>
      <SectionHeading
        description="Configure pagamento, desconto e condições de transporte."
        title="Financeiro e transporte"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Forma de Pagamento */}
        <Controller
          control={control}
          name="paymentWay"
          render={({ field }) => (
            <Select
              className="w-full"
              isInvalid={!!errors.paymentTerms}
              onSelectionChange={(key) => field.onChange(key?.toString() || "")}
              placeholder="Selecione..."
              selectedKey={field.value}
              variant="secondary"
            >
              <Label>Forma de Pagamento</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox items={PAYMENT_TERMS}>
                  {(term) => (
                    <ListBox.Item
                      id={term.id}
                      key={term.id}
                      textValue={term.name}
                    >
                      {term.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  )}
                </ListBox>
              </Select.Popover>
              {errors.paymentTerms && (
                <FieldError>{errors.paymentTerms.message}</FieldError>
              )}
            </Select>
          )}
        />

        {/* Condição de Pagamento */}
        <Controller
          control={control}
          name="paymentTerms"
          render={({ field }) => (
            <TextField className="w-full" isInvalid={!!errors.paymentTerms}>
              <Label>Condição de Pagamento</Label>
              <Input
                {...field}
                placeholder="Ex.: 30/60 dias"
                variant="secondary"
              />
              {errors.paymentTerms && (
                <FieldError>{errors.paymentTerms.message}</FieldError>
              )}
            </TextField>
          )}
        />

        {/* Retirada no local */}
        <Controller
          control={control}
          name="isPickup"
          render={({ field }) => (
            <Checkbox
              id="isPickup"
              isSelected={field.value}
              onChange={field.onChange}
              variant="secondary"
            >
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label htmlFor="isPickup">Retirada no local</Label>
              </Checkbox.Content>
            </Checkbox>
          )}
        />

        {/* Tipo de Frete */}
        <Controller
          control={control}
          name="freightType"
          render={({ field }) => (
            <Select
              className="w-full"
              isDisabled={watchedIsPickup}
              isInvalid={!!errors.freightType}
              onSelectionChange={(key) =>
                field.onChange(key?.toString() || undefined)
              }
              placeholder="Selecione..."
              selectedKey={field.value || null}
              variant="secondary"
            >
              <Label>Tipo de Frete</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="cif" textValue="CIF">
                    CIF
                  </ListBox.Item>
                  <ListBox.Item id="fob" textValue="FOB">
                    FOB
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
              {errors.freightType && (
                <FieldError>{errors.freightType.message}</FieldError>
              )}
            </Select>
          )}
        />

        {/* Valor do Frete */}
        <Controller
          control={control}
          name="freight"
          render={({ field }) => (
            <NumberField
              className="w-full"
              formatOptions={{ style: "currency", currency: "BRL" }}
              isDisabled={isFreightDisabled}
              minValue={0}
              onChange={field.onChange}
              step={10}
              value={field.value}
              variant="secondary"
            >
              <Label>Valor do Frete</Label>
              <NumberField.Group className="w-full">
                <NumberField.Input className="w-full" />
              </NumberField.Group>
            </NumberField>
          )}
        />
        {/* Desconto Global */}
        <I18nProvider locale="pt-BR">
          <Controller
            control={control}
            name="discount"
            render={({ field }) => (
              <NumberField
                className="w-full"
                minValue={0}
                maxValue={100}
                step={0.01}
                value={typeof field.value === "number" ? field.value : 0}
                onChange={(value) => field.onChange(value ?? 0)}
                variant="secondary"
              >
                <Label>Desconto Global (%)</Label>
                <NumberField.Group className="flex w-full">
                  <NumberField.Input className="flex-1 w-full" />
                </NumberField.Group>
                {errors.discount && (
                  <FieldError>{errors.discount.message}</FieldError>
                )}
              </NumberField>
            )}
          />
        </I18nProvider>
      </div>
    </div>
  );
};

export default FinancialSection;
