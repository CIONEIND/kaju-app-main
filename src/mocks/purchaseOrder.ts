import type { BoxType } from "@/schemas/purchaseOrder";

export type PurchaseOrderStatus =
  | "Rascunho"
  | "Aguardando Autorização"
  | "Aprovado"
  | "Rejeitado"
  | "Aguardando pagamento"
  | "Reservado"
  | "Pago";

export interface PurchaseOrderItem {
  id: string;
  productName: string;
  quantity: number;
  pricePerKg: number;
  totalWeight: number;
  totalPrice: number;
}

export interface PurchaseOrderSummary {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  status: PurchaseOrderStatus;
  totalWeightKg: number;
  totalPrice: number;
  items: PurchaseOrderItem[];
}

export interface ClientPricePoint {
  month: string;
  label: string;
  clientPricePerKg: number;
  basePricePerKg: number;
}

export interface ClientProductHistory {
  productId: string;
  productName: string;
  lastOrderDate: string;
  lastNegotiatedPricePerKg: number;
  lastBoxType: BoxType;
  trend: ClientPricePoint[];
}

export interface ClientProfile {
  clientId: string;
  partnerSince: string;
  averageTicket: number;
  totalOrders: number;
  lastPurchaseDate: string;
  notes: string;
  recentOrders: PurchaseOrderSummary[];
  productHistory: ClientProductHistory[];
}

export const MOCK_ORDERS: PurchaseOrderSummary[] = [
  {
    id: "1049",
    date: "2026-04-10",
    clientId: "c1",
    clientName: "Castanhas do Brasil Ltda",
    status: "Aprovado",
    totalWeightKg: 226.8,
    totalPrice: 11340.0,
    items: [
      {
        id: "i1049-1",
        productName: "Castanha W1",
        quantity: 10,
        pricePerKg: 50.0,
        totalWeight: 226.8,
        totalPrice: 11340.0,
      },
    ],
  },
  {
    id: "1051",
    date: "2026-04-12",
    clientId: "c2",
    clientName: "Exportadora Nordeste S/A",
    status: "Aguardando Autorização",
    totalWeightKg: 113.4,
    totalPrice: 4500.0,
    items: [
      {
        id: "i1051-1",
        productName: "Castanha W2",
        quantity: 10,
        pricePerKg: 39.68,
        totalWeight: 113.4,
        totalPrice: 4500.0,
      },
    ],
  },
  {
    id: "1047",
    date: "2026-04-08",
    clientId: "c3",
    clientName: "Caju Premium Comércio",
    status: "Pago",
    totalWeightKg: 68.04,
    totalPrice: 3497.26,
    items: [
      {
        id: "i1047-1",
        productName: "Castanha W1",
        quantity: 3,
        pricePerKg: 51.4,
        totalWeight: 68.04,
        totalPrice: 3497.26,
      },
    ],
  },
];

const CLIENT_1_RECENT_ORDERS: PurchaseOrderSummary[] = [
  MOCK_ORDERS[0],
  {
    id: "1042",
    date: "2026-03-15",
    clientId: "c1",
    clientName: "Castanhas do Brasil Ltda",
    status: "Pago",
    totalWeightKg: 181.44,
    totalPrice: 8709.12,
    items: [
      {
        id: "i1042-1",
        productName: "Castanha W1",
        quantity: 8,
        pricePerKg: 48.0,
        totalWeight: 181.44,
        totalPrice: 8709.12,
      },
    ],
  },
  {
    id: "1034",
    date: "2026-02-12",
    clientId: "c1",
    clientName: "Castanhas do Brasil Ltda",
    status: "Aprovado",
    totalWeightKg: 68.04,
    totalPrice: 2823.66,
    items: [
      {
        id: "i1034-1",
        productName: "Castanha W2",
        quantity: 6,
        pricePerKg: 41.5,
        totalWeight: 68.04,
        totalPrice: 2823.66,
      },
    ],
  },
  {
    id: "1028",
    date: "2026-01-18",
    clientId: "c1",
    clientName: "Castanhas do Brasil Ltda",
    status: "Pago",
    totalWeightKg: 136.08,
    totalPrice: 6695.14,
    items: [
      {
        id: "i1028-1",
        productName: "Castanha W1",
        quantity: 6,
        pricePerKg: 49.2,
        totalWeight: 136.08,
        totalPrice: 6695.14,
      },
    ],
  },
  {
    id: "1016",
    date: "2025-12-05",
    clientId: "c1",
    clientName: "Castanhas do Brasil Ltda",
    status: "Pago",
    totalWeightKg: 90.72,
    totalPrice: 4309.2,
    items: [
      {
        id: "i1016-1",
        productName: "Castanha W1",
        quantity: 4,
        pricePerKg: 47.5,
        totalWeight: 90.72,
        totalPrice: 4309.2,
      },
    ],
  },
];

const CLIENT_2_RECENT_ORDERS: PurchaseOrderSummary[] = [
  MOCK_ORDERS[1],
  {
    id: "1040",
    date: "2026-03-05",
    clientId: "c2",
    clientName: "Exportadora Nordeste S/A",
    status: "Aprovado",
    totalWeightKg: 113.4,
    totalPrice: 5307.12,
    items: [
      {
        id: "i1040-1",
        productName: "Castanha W1",
        quantity: 5,
        pricePerKg: 46.8,
        totalWeight: 113.4,
        totalPrice: 5307.12,
      },
    ],
  },
  {
    id: "1031",
    date: "2026-02-01",
    clientId: "c2",
    clientName: "Exportadora Nordeste S/A",
    status: "Aprovado",
    totalWeightKg: 90.72,
    totalPrice: 3646.94,
    items: [
      {
        id: "i1031-1",
        productName: "Castanha W2",
        quantity: 8,
        pricePerKg: 40.2,
        totalWeight: 90.72,
        totalPrice: 3646.94,
      },
    ],
  },
  {
    id: "1021",
    date: "2025-12-21",
    clientId: "c2",
    clientName: "Exportadora Nordeste S/A",
    status: "Pago",
    totalWeightKg: 90.72,
    totalPrice: 4298.13,
    items: [
      {
        id: "i1021-1",
        productName: "Castanha W1",
        quantity: 4,
        pricePerKg: 47.38,
        totalWeight: 90.72,
        totalPrice: 4298.13,
      },
    ],
  },
  {
    id: "1010",
    date: "2025-11-11",
    clientId: "c2",
    clientName: "Exportadora Nordeste S/A",
    status: "Pago",
    totalWeightKg: 68.04,
    totalPrice: 2789.64,
    items: [
      {
        id: "i1010-1",
        productName: "Castanha W2",
        quantity: 6,
        pricePerKg: 41.0,
        totalWeight: 68.04,
        totalPrice: 2789.64,
      },
    ],
  },
];

const CLIENT_3_RECENT_ORDERS: PurchaseOrderSummary[] = [
  MOCK_ORDERS[2],
  {
    id: "1036",
    date: "2026-03-02",
    clientId: "c3",
    clientName: "Caju Premium Comércio",
    status: "Aprovado",
    totalWeightKg: 113.4,
    totalPrice: 3764.88,
    items: [
      {
        id: "i1036-1",
        productName: "Castanha Batoque",
        quantity: 10,
        pricePerKg: 33.2,
        totalWeight: 113.4,
        totalPrice: 3764.88,
      },
    ],
  },
  {
    id: "1024",
    date: "2026-01-27",
    clientId: "c3",
    clientName: "Caju Premium Comércio",
    status: "Pago",
    totalWeightKg: 45.36,
    totalPrice: 2304.29,
    items: [
      {
        id: "i1024-1",
        productName: "Castanha W1",
        quantity: 2,
        pricePerKg: 50.8,
        totalWeight: 45.36,
        totalPrice: 2304.29,
      },
    ],
  },
  {
    id: "1018",
    date: "2025-12-14",
    clientId: "c3",
    clientName: "Caju Premium Comércio",
    status: "Pago",
    totalWeightKg: 68.04,
    totalPrice: 2224.91,
    items: [
      {
        id: "i1018-1",
        productName: "Castanha Batoque",
        quantity: 6,
        pricePerKg: 32.7,
        totalWeight: 68.04,
        totalPrice: 2224.91,
      },
    ],
  },
  {
    id: "1009",
    date: "2025-11-04",
    clientId: "c3",
    clientName: "Caju Premium Comércio",
    status: "Aprovado",
    totalWeightKg: 45.36,
    totalPrice: 2245.32,
    items: [
      {
        id: "i1009-1",
        productName: "Castanha W1",
        quantity: 4,
        pricePerKg: 49.5,
        totalWeight: 45.36,
        totalPrice: 2245.32,
      },
    ],
  },
];

export const MOCK_CLIENT_PROFILES: Record<string, ClientProfile> = {
  c1: {
    clientId: "c1",
    partnerSince: "2021-02-18",
    averageTicket: 9312.47,
    totalOrders: 28,
    lastPurchaseDate: "2026-04-10",
    notes:
      "Conta madura com foco em giro rápido. Costuma negociar volume em W1, mas aceita recomposição de preço quando o câmbio sobe.",
    recentOrders: CLIENT_1_RECENT_ORDERS,
    productHistory: [
      {
        productId: "p1",
        productName: "Castanha W1",
        lastOrderDate: "2026-04-10",
        lastNegotiatedPricePerKg: 50.0,
        lastBoxType: "FULL",
        trend: [
          {
            month: "2025-11",
            label: "Nov",
            clientPricePerKg: 47.2,
            basePricePerKg: 49.0,
          },
          {
            month: "2025-12",
            label: "Dez",
            clientPricePerKg: 47.5,
            basePricePerKg: 50.0,
          },
          {
            month: "2026-01",
            label: "Jan",
            clientPricePerKg: 49.2,
            basePricePerKg: 50.8,
          },
          {
            month: "2026-02",
            label: "Fev",
            clientPricePerKg: 49.0,
            basePricePerKg: 51.2,
          },
          {
            month: "2026-03",
            label: "Mar",
            clientPricePerKg: 48.0,
            basePricePerKg: 52.0,
          },
          {
            month: "2026-04",
            label: "Abr",
            clientPricePerKg: 50.0,
            basePricePerKg: 51.4,
          },
        ],
      },
      {
        productId: "p2",
        productName: "Castanha W2",
        lastOrderDate: "2026-02-12",
        lastNegotiatedPricePerKg: 41.5,
        lastBoxType: "HALF",
        trend: [
          {
            month: "2025-11",
            label: "Nov",
            clientPricePerKg: 40.5,
            basePricePerKg: 42.2,
          },
          {
            month: "2025-12",
            label: "Dez",
            clientPricePerKg: 40.9,
            basePricePerKg: 42.5,
          },
          {
            month: "2026-01",
            label: "Jan",
            clientPricePerKg: 41.2,
            basePricePerKg: 43.0,
          },
          {
            month: "2026-02",
            label: "Fev",
            clientPricePerKg: 41.5,
            basePricePerKg: 43.4,
          },
          {
            month: "2026-03",
            label: "Mar",
            clientPricePerKg: 41.0,
            basePricePerKg: 44.0,
          },
          {
            month: "2026-04",
            label: "Abr",
            clientPricePerKg: 42.0,
            basePricePerKg: 44.4,
          },
        ],
      },
    ],
  },
  c2: {
    clientId: "c2",
    partnerSince: "2022-07-06",
    averageTicket: 4108.37,
    totalOrders: 17,
    lastPurchaseDate: "2026-04-12",
    notes:
      "Cliente exportador e bastante sensível ao dólar. Responde bem a dados comparativos entre preço histórico e preço-base.",
    recentOrders: CLIENT_2_RECENT_ORDERS,
    productHistory: [
      {
        productId: "p1",
        productName: "Castanha W1",
        lastOrderDate: "2026-03-05",
        lastNegotiatedPricePerKg: 46.8,
        lastBoxType: "FULL",
        trend: [
          {
            month: "2025-11",
            label: "Nov",
            clientPricePerKg: 46.4,
            basePricePerKg: 49.0,
          },
          {
            month: "2025-12",
            label: "Dez",
            clientPricePerKg: 46.8,
            basePricePerKg: 50.0,
          },
          {
            month: "2026-01",
            label: "Jan",
            clientPricePerKg: 47.0,
            basePricePerKg: 50.8,
          },
          {
            month: "2026-02",
            label: "Fev",
            clientPricePerKg: 46.6,
            basePricePerKg: 51.2,
          },
          {
            month: "2026-03",
            label: "Mar",
            clientPricePerKg: 46.8,
            basePricePerKg: 52.0,
          },
          {
            month: "2026-04",
            label: "Abr",
            clientPricePerKg: 47.2,
            basePricePerKg: 51.4,
          },
        ],
      },
      {
        productId: "p2",
        productName: "Castanha W2",
        lastOrderDate: "2026-04-12",
        lastNegotiatedPricePerKg: 39.68,
        lastBoxType: "HALF",
        trend: [
          {
            month: "2025-11",
            label: "Nov",
            clientPricePerKg: 41.0,
            basePricePerKg: 42.2,
          },
          {
            month: "2025-12",
            label: "Dez",
            clientPricePerKg: 40.8,
            basePricePerKg: 42.5,
          },
          {
            month: "2026-01",
            label: "Jan",
            clientPricePerKg: 40.4,
            basePricePerKg: 43.0,
          },
          {
            month: "2026-02",
            label: "Fev",
            clientPricePerKg: 40.2,
            basePricePerKg: 43.4,
          },
          {
            month: "2026-03",
            label: "Mar",
            clientPricePerKg: 39.8,
            basePricePerKg: 44.0,
          },
          {
            month: "2026-04",
            label: "Abr",
            clientPricePerKg: 39.68,
            basePricePerKg: 44.4,
          },
        ],
      },
    ],
  },
  c3: {
    clientId: "c3",
    partnerSince: "2024-01-11",
    averageTicket: 2807.53,
    totalOrders: 9,
    lastPurchaseDate: "2026-04-08",
    notes:
      "Conta em expansão com boa aceitação de produtos premium. Usa o histórico recente para validar aumentos sem travar a conversão.",
    recentOrders: CLIENT_3_RECENT_ORDERS,
    productHistory: [
      {
        productId: "p1",
        productName: "Castanha W1",
        lastOrderDate: "2026-04-08",
        lastNegotiatedPricePerKg: 51.4,
        lastBoxType: "FULL",
        trend: [
          {
            month: "2025-11",
            label: "Nov",
            clientPricePerKg: 49.5,
            basePricePerKg: 49.0,
          },
          {
            month: "2025-12",
            label: "Dez",
            clientPricePerKg: 50.2,
            basePricePerKg: 50.0,
          },
          {
            month: "2026-01",
            label: "Jan",
            clientPricePerKg: 50.8,
            basePricePerKg: 50.8,
          },
          {
            month: "2026-02",
            label: "Fev",
            clientPricePerKg: 51.1,
            basePricePerKg: 51.2,
          },
          {
            month: "2026-03",
            label: "Mar",
            clientPricePerKg: 51.0,
            basePricePerKg: 52.0,
          },
          {
            month: "2026-04",
            label: "Abr",
            clientPricePerKg: 51.4,
            basePricePerKg: 51.4,
          },
        ],
      },
      {
        productId: "p3",
        productName: "Castanha Batoque",
        lastOrderDate: "2026-03-02",
        lastNegotiatedPricePerKg: 33.2,
        lastBoxType: "HALF",
        trend: [
          {
            month: "2025-11",
            label: "Nov",
            clientPricePerKg: 31.8,
            basePricePerKg: 33.0,
          },
          {
            month: "2025-12",
            label: "Dez",
            clientPricePerKg: 32.7,
            basePricePerKg: 34.0,
          },
          {
            month: "2026-01",
            label: "Jan",
            clientPricePerKg: 33.0,
            basePricePerKg: 34.5,
          },
          {
            month: "2026-02",
            label: "Fev",
            clientPricePerKg: 33.1,
            basePricePerKg: 34.7,
          },
          {
            month: "2026-03",
            label: "Mar",
            clientPricePerKg: 33.2,
            basePricePerKg: 35.0,
          },
          {
            month: "2026-04",
            label: "Abr",
            clientPricePerKg: 33.0,
            basePricePerKg: 35.2,
          },
        ],
      },
    ],
  },
};
