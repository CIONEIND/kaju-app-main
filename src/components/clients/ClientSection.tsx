import {
  FieldError,
  Input,
  Label,
  ListBox,
  Radio,
  RadioGroup,
  Select,
  TextField,
} from "@heroui/react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { CreateClientSchemaType } from "@/app/(protected)/clientes/schemas/clientAddress";
import { SectionHeading } from "@/components/ui/page";
import { maskCpfCnpj } from "@/utils/masks";

export const ClientSection = () => {
  const {
    control,
    setValue,
    resetField,
    formState: { errors },
  } = useFormContext<CreateClientSchemaType>();

  const tipoPessoa = useWatch({ control, name: "tipoPessoa" });

  // Clear RG if user switches back to Pessoa Jurídica (1)
  return (
    <div className="mb-8 flex flex-col gap-6">
      <SectionHeading
        description="Dados fiscais e comerciais usados nos pedidos."
        title="Dados do cliente"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Nome do Cliente */}
        <Controller
          control={control}
          name="nomePessoa"
          render={({ field }) => (
            <TextField
              className="w-full md:col-span-4"
              isInvalid={!!errors.nomePessoa}
            >
              <Label>Nome / Razão Social</Label>
              <Input
                {...field}
                placeholder="Digite o nome do cliente"
                variant="secondary"
              />
              {errors.nomePessoa && (
                <FieldError>{errors.nomePessoa.message}</FieldError>
              )}
            </TextField>
          )}
        />

        {/* Tipo de Pessoa (1 = PJ, 2 = PF) */}
        <Controller
          control={control}
          name="tipoPessoa"
          render={({ field }) => (
            <div className="w-full md:col-span-2 flex flex-col gap-2 justify-center">
              <Label className="text-sm font-medium">Tipo de Pessoa</Label>
              <RadioGroup
                orientation="horizontal"
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  resetField("cpfCnpj");

                  if (value === "1") {
                    setValue("rg", "");
                  }
                }}
                isInvalid={!!errors.tipoPessoa}
              >
                <Radio value="1">
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  <Radio.Content>
                    <Label>Pessoa Jurídica</Label>
                  </Radio.Content>
                </Radio>
                <Radio value="2">
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  <Radio.Content>
                    <Label>Pessoa Física</Label>
                  </Radio.Content>
                </Radio>
              </RadioGroup>
              {errors.tipoPessoa && (
                <FieldError className="text-xs text-danger">
                  {errors.tipoPessoa.message}
                </FieldError>
              )}
            </div>
          )}
        />

        {/* CPF / CNPJ */}
        <Controller
          control={control}
          name="cpfCnpj"
          render={({ field }) => (
            <TextField
              className="w-full md:col-span-1"
              isInvalid={!!errors.cpfCnpj}
            >
              <Label>{tipoPessoa === "2" ? "CPF" : "CNPJ"}</Label>
              <Input
                {...field}
                onChange={(e) =>
                  field.onChange(maskCpfCnpj(e.target.value, tipoPessoa))
                }
                variant="secondary"
              />
              {errors.cpfCnpj && (
                <FieldError>{errors.cpfCnpj.message}</FieldError>
              )}
            </TextField>
          )}
        />

        {/* RG (Only enabled if PF) */}
        <Controller
          control={control}
          name="rg"
          render={({ field }) => (
            <TextField className="w-full md:col-span-1" isInvalid={!!errors.rg}>
              <Label>RG</Label>
              <Input
                {...field}
                variant="secondary"
                disabled={tipoPessoa === "1"}
              />
              {errors.rg && <FieldError>{errors.rg.message}</FieldError>}
            </TextField>
          )}
        />

        {/* Mercado (cdAve) */}
        <Controller
          control={control}
          name="cdAve"
          render={({ field }) => (
            <div className="w-full md:col-span-2 flex flex-col gap-1">
              <Label>Mercado</Label>
              <Select
                value={field.value}
                onChange={(val) => field.onChange(val?.toString())}
                variant="secondary"
                aria-label="Mercado"
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="84" textValue="Mercado Interno">
                      Mercado Interno
                    </ListBox.Item>
                    <ListBox.Item id="85" textValue="Mercado Externo">
                      Mercado Externo
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
              {errors.cdAve && (
                <span className="text-tiny text-danger">
                  {errors.cdAve.message}
                </span>
              )}
            </div>
          )}
        />

        {/* Moeda (cdInf) */}
        <Controller
          control={control}
          name="cdInf"
          render={({ field }) => (
            <div className="w-full md:col-span-2 flex flex-col gap-1">
              <Label>Moeda</Label>
              <Select
                value={field.value}
                onChange={(val) => field.onChange(val?.toString())}
                variant="secondary"
                aria-label="Moeda"
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="1" textValue="Real">
                      Real
                    </ListBox.Item>
                    <ListBox.Item id="5" textValue="Dólar">
                      Dólar
                    </ListBox.Item>
                    <ListBox.Item id="6" textValue="Euro">
                      Euro
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
              {errors.cdInf && (
                <span className="text-tiny text-danger">
                  {errors.cdInf.message}
                </span>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
};
