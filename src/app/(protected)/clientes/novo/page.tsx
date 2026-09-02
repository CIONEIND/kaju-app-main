"use client";

import { Button, Form, Separator, Toast, toast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { CLIENTS_QUERY_KEY } from "@/hooks/useClients";
import {
  type CreateClientSchemaType,
  createClientSchema,
} from "@/app/(protected)/clientes/schemas/clientAddress";
import AddressSection from "@/components/clients/AddressSection";
import { ClientSection } from "@/components/clients/ClientSection";
import { PageHeader, PageShell, Panel } from "@/components/ui/page";

export default function CreateClientAddressTestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const methods = useForm<CreateClientSchemaType>({
    resolver: zodResolver(createClientSchema),
    mode: "onChange",
    defaultValues: {
      // New Client Default Values
      nomePessoa: "",
      tipoPessoa: "1", // Defaults to Jurídica
      cpfCnpj: "",
      rg: "",
      cdAve: "84", // Defaults to Mercado Interno
      cdInf: "1", // Defaults to Real

      isBrazil: true,
      postalCode: "",
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      complement: "",
    },
  });

  const onSubmit = async (data: CreateClientSchemaType) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Não foi possível salvar o cliente.",
        );
      }

      // Success!
      await response.json();

      toast("Cliente salvo com sucesso!");

      await queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      router.push("/clientes/consultar");
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Erro ao salvar / Error saving.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Toast.Provider placement="top end" />
      <FormProvider {...methods}>
        <Form
          className="flex w-full flex-col gap-5"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <PageShell>
            <PageHeader
              description="Cadastre dados comerciais, fiscais e endereço do cliente."
              eyebrow="Relacionamento"
              title="Novo cliente"
              actions={
                <Button type="submit" isDisabled={isSaving} variant="primary">
                  {isSaving ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Salvando
                    </>
                  ) : (
                    "Salvar cliente"
                  )}
                </Button>
              }
            />

            <Panel className="flex flex-col gap-6 p-5">
              <ClientSection />

              <Separator />

              <AddressSection />
            </Panel>
          </PageShell>
        </Form>
      </FormProvider>
    </>
  );
}
