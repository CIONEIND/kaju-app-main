"use client";

import { Button, Form, Separator, Toast, toast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { CLIENTS_QUERY_KEY } from "@/hooks/useClients";

import {
  type CreateClientSchemaType,
  createClientSchema,
} from "@/app/(protected)/clientes/schemas/clientAddress";
import AddressSection from "@/components/clients/AddressSection";
import { ClientSection } from "@/components/clients/ClientSection";
import { FormSkeleton } from "@/components/ui/loading";
import { PageHeader, PageShell, Panel } from "@/components/ui/page";
import type { ClienteDetalhe } from "@/lib/top-manager/repository/cliente/type";

const defaultValues: CreateClientSchemaType = {
  nomePessoa: "",
  tipoPessoa: "1",
  cpfCnpj: "",
  rg: "",
  cdAve: "84",
  cdInf: "1",
  isBrazil: true,
  postalCode: "",
  street: "",
  streetNumber: "",
  neighborhood: "",
  city: "",
  state: "",
  complement: "",
  country: "",
};

function mapClientToForm(client: ClienteDetalhe): CreateClientSchemaType {
  return {
    nomePessoa: client.nomePessoa,
    tipoPessoa: client.tipoPessoa,
    cpfCnpj:
      client.tipoPessoa === "2"
        ? client.cpfCnpj?.padStart(11, "0")
        : client.cpfCnpj?.padStart(14, "0"),
    rg: client.rg ?? "",
    cdAve: client.cdAve,
    cdInf: client.cdInf,
    isBrazil: client.country === "Brasil",
    postalCode: client.postalCode ?? "",
    street: client.street ?? "",
    streetNumber: client.streetNumber ?? "",
    neighborhood: client.neighborhood ?? "",
    city: client.city ?? "",
    state: client.state ?? "",
    complement: client.complement ?? "",
    country: client.isBrazil ? "Brasil" : (client.country ?? ""),
  };
}

export default function EditClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const methods = useForm<CreateClientSchemaType>({
    resolver: zodResolver(createClientSchema),
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!clientId) {
      setIsLoadingClient(false);
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    async function loadClient() {
      setIsLoadingClient(true);

      try {
        const response = await fetch(`/api/clients/${clientId}`, {
          signal: controller.signal,
        });

        const payload = (await response.json()) as
          | ClienteDetalhe
          | { error?: string; message?: string };

        if (!response.ok) {
          const error =
            "error" in payload
              ? (payload.error ?? payload.message)
              : "Não foi possível carregar o cliente.";

          throw new Error(error ?? "Não foi possível carregar o cliente.");
        }

        if (isActive) {
          methods.reset(mapClientToForm(payload as ClienteDetalhe));
        }
      } catch (error) {
        if (!controller.signal.aborted && isActive) {
          toast(
            error instanceof Error
              ? error.message
              : "Erro ao carregar cliente.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingClient(false);
        }
      }
    }

    loadClient();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [clientId, methods]);

  const onSubmit = async (data: CreateClientSchemaType) => {
    if (!clientId) {
      toast("Cliente inválido.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            payload.message ??
            "Não foi possível salvar o cliente.",
        );
      }

      toast("Cliente atualizado com sucesso!");

      await queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      router.push("/clientes/consultar");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erro ao salvar cliente.");
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
              description="Atualize os dados cadastrais e o endereço do cliente."
              eyebrow="Relacionamento"
              title="Editar cliente"
              actions={
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onPress={() => router.push("/clientes/consultar")}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    isDisabled={isSaving || isLoadingClient}
                    variant="primary"
                  >
                    {isSaving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      "Salvar alterações"
                    )}
                  </Button>
                </>
              }
            />

            {isLoadingClient ? (
              <FormSkeleton />
            ) : (
              <Panel className="flex flex-col gap-6 p-5">
                <ClientSection />

                <Separator />

                <AddressSection />
              </Panel>
            )}
          </PageShell>
        </Form>
      </FormProvider>
    </>
  );
}
