"use client";

import { Form, Separator, Toast, toast } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
// Services
import { getSockPositionWithReservations } from "@/app/services/product/productService";
import { useClients } from "@/hooks/useClients";
import type { VirtualStock } from "@/app/services/product/types";
import ClientSection from "@/components/purchase-order/client-section/ClientSection";
import FinancialSection from "@/components/purchase-order/FinancialSection";
import { ItemsSection } from "@/components/purchase-order/ItemsSection";
// Extracted Components
import OrderHeader from "@/components/purchase-order/OrderHeader";
import { FormSkeleton } from "@/components/ui/loading";
import { PageShell, Panel } from "@/components/ui/page";
// Schemas & Types
import {
  type PurchaseOrderFormValues,
  purchaseOrderSchema,
} from "@/schemas/purchaseOrder";

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseOrderId = searchParams.get("id");

  const { data: clients = [] } = useClients();
  const [products, setProducts] = useState<VirtualStock[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [persistedOrderNumber, setPersistedOrderNumber] = useState<
    number | null
  >(null);

  const methods = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      clientId: "",
      date: new Date().toISOString().split("T")[0],
      paymentWay: "",
      paymentTerms: "",
      isPickup: true,
      freightType: undefined,
      freight: 0,
      discount: 0,
      items: [],
    },
  });

  useEffect(() => {
    async function loadProducts() {
      setIsLoadingProducts(true);
      try {
        const fetchedProducts = await getSockPositionWithReservations();
        setProducts(fetchedProducts);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  // Fetch Existing Order
  useEffect(() => {
    if (!purchaseOrderId) return;

    async function loadPurchaseOrder() {
      setIsLoadingOrder(true);
      try {
        const response = await fetch(`/api/purchase-orders/${purchaseOrderId}`);
        if (!response.ok)
          throw new Error("Nao foi possivel carregar o pedido.");

        const order = await response.json();
        methods.reset(order);
        setPersistedOrderNumber(order.number);
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Erro ao carregar pedido.",
        );
      } finally {
        setIsLoadingOrder(false);
      }
    }
    loadPurchaseOrder();
  }, [purchaseOrderId, methods]);

  const onSubmit = async (data: PurchaseOrderFormValues) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/purchase-orders", {
        body: JSON.stringify({ ...data, id: purchaseOrderId ?? undefined }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? "Nao foi possivel salvar o pedido.");
      }

      const savedOrder = await response.json();
      setPersistedOrderNumber(savedOrder.number);

      // if (!purchaseOrderId) {
      //   router.replace(`/pedidos/novo?id=${savedOrder.id}`);
      // }

      toast(`Pedido #${savedOrder.number} salvo com sucesso.`);
      router.push("/pedidos");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erro ao salvar pedido.");
    } finally {
      setIsSaving(false);
    }
  };

  // Extracting authorization check for the header (optional, or pass down)
  const watchedItems = methods.watch("items") || [];
  const requiresAuthorization = watchedItems.some((item) => {
    const p = products.find((prod) => prod.id === item.productId);
    return p && item.customPricePerKg < p.minPricePerKg;
  });

  return (
    <>
      <Toast.Provider placement="top end" />
      <FormProvider {...methods}>
        <Form
          className="flex w-full flex-col gap-5"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <PageShell>
            <OrderHeader
              isEditing={!!purchaseOrderId}
              orderNumber={persistedOrderNumber}
              isSaving={isSaving}
              isLoading={isLoadingOrder}
              requiresAuthorization={requiresAuthorization}
              onCancel={() => window.history.back()}
            />

            {isLoadingOrder ? (
              <FormSkeleton />
            ) : (
              <Panel className="flex flex-col gap-6 p-5">
                <ClientSection
                  clients={clients}
                  orderNumber={persistedOrderNumber}
                />

                <Separator />

                <FinancialSection />

                <Separator />

                <ItemsSection
                  products={products}
                  isLoadingProducts={isLoadingProducts}
                />
              </Panel>
            )}
          </PageShell>
        </Form>
      </FormProvider>
    </>
  );
}
