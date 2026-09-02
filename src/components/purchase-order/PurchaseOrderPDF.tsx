import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

const BRAND = "#1e3a5f";
const BRAND_LIGHT = "#e8eef5";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const ROW_ALT = "#f8fafc";
const SUCCESS = "#166534";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: "#0f172a", paddingHorizontal: 40, paddingVertical: 40 },

  // Header
  headerBlock: { backgroundColor: BRAND, borderRadius: 6, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flexDirection: "column", gap: 2 },
  companyName: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 0.5 },
  companySubtitle: { fontSize: 8, color: "#93c5fd", letterSpacing: 0.3 },
  headerRight: { alignItems: "flex-end", gap: 3 },
  docTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 1 },
  orderNumber: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#93c5fd" },

  // Info grid
  infoGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  infoBox: { flex: 1, backgroundColor: BRAND_LIGHT, borderRadius: 5, padding: 12 },
  infoBoxTitle: { fontSize: 7, fontFamily: "Helvetica-Bold", color: BRAND, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#bfdbfe", paddingBottom: 4 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  infoLabel: { fontSize: 8, color: MUTED, flex: 1 },
  infoValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0f172a", flex: 2, textAlign: "right" },

  // Table
  tableWrapper: { marginBottom: 16 },
  tableTitle: { fontSize: 7, fontFamily: "Helvetica-Bold", color: BRAND, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  tableHeader: { flexDirection: "row", backgroundColor: BRAND, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 4 },
  tableHeaderCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#ffffff", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  tableRowAlt: { backgroundColor: ROW_ALT },
  tableCell: { fontSize: 8.5, color: "#0f172a" },
  tableCellMuted: { fontSize: 8, color: MUTED },

  // Col widths
  colProduct: { flex: 3 },
  colBoxType: { flex: 2 },
  colQty: { width: 40, textAlign: "center" },
  colPriceKg: { width: 56, textAlign: "right" },
  colWeight: { width: 60, textAlign: "right" },
  colTotal: { width: 66, textAlign: "right" },

  // Totals
  totalsWrapper: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  totalsBox: { width: 220, borderWidth: 1, borderColor: BORDER, borderRadius: 5, overflow: "hidden" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: BORDER },
  totalsLastRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 7, backgroundColor: BRAND },
  totalsLabel: { fontSize: 8, color: MUTED },
  totalsValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  totalsFinalLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  totalsFinalValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#93c5fd" },

  // Footer
  footer: { position: "absolute", bottom: 28, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8 },
  footerText: { fontSize: 7, color: MUTED },
  statusBadge: { fontSize: 7, fontFamily: "Helvetica-Bold", color: SUCCESS, backgroundColor: "#dcfce7", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
});

const fmt = {
  currency: (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v),
  weight: (v: number) =>
    `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(v)} kg`,
  date: (s: string) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(s)),
  dateTime: (s: string) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(s)),
};

const BOX_TYPE_LABEL: Record<string, string> = {
  FULL: "22.68 kg — Caixa Completa",
  HALF: "11.34 kg — Meia Caixa",
};

const FREIGHT_TYPE_LABEL: Record<string, string> = {
  fob: "FOB (Frete por conta do comprador)",
  cif: "CIF (Frete por conta do vendedor)",
};

export interface PurchaseOrderPDFData {
  number: number;
  date: string;
  clientName: string;
  clientCnpj?: string | null;
  paymentWay: string;
  paymentTerms: string;
  isPickup: boolean;
  freightType: string;
  freight: number;
  discount: number;
  discountAmount: number;
  subtotal: number;
  totalPrice: number;
  totalWeight: number;
  orderStatus: string;
  financialStatus: string;
  items: Array<{
    id: string;
    productId: number;
    productName?: string | null;
    boxType: string;
    quantity: number;
    customPricePerKg: number;
    boxWeightKg: number;
    totalWeight: number;
    totalPrice: number;
  }>;
  generatedAt: string;
}

export function PurchaseOrderDocument({ data }: { data: PurchaseOrderPDFData }) {
  const delivery = data.isPickup
    ? "Retirada pelo comprador"
    : FREIGHT_TYPE_LABEL[data.freightType] ?? data.freightType;

  return (
    <Document title={`Pedido #${data.number}`} author="Cione">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerBlock}>
          <View style={s.headerLeft}>
            <Text style={s.companyName}>CIONE</Text>
            <Text style={s.companySubtitle}>Perene como o cajueiro</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.docTitle}>PEDIDO DE COMPRA</Text>
            <Text style={s.orderNumber}>#{data.number}</Text>
          </View>
        </View>

        {/* Info grid row 1 — client + order */}
        <View style={s.infoGrid}>
          <View style={[s.infoBox, { flex: 2 }]}>
            <Text style={s.infoBoxTitle}>Cliente</Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Razão Social</Text>
              <Text style={[s.infoValue, { fontSize: 10 }]}>{data.clientName}</Text>
            </View>
            {data.clientCnpj && (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>CNPJ</Text>
                <Text style={s.infoValue}>{data.clientCnpj}</Text>
              </View>
            )}
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoBoxTitle}>Pedido</Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Data de emissão</Text>
              <Text style={s.infoValue}>{fmt.date(data.date)}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Status</Text>
              <Text style={s.infoValue}>{data.orderStatus}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Financeiro</Text>
              <Text style={s.infoValue}>{data.financialStatus}</Text>
            </View>
          </View>
        </View>

        {/* Info grid row 2 — payment + logistics */}
        <View style={[s.infoGrid, { marginBottom: 20 }]}>
          <View style={s.infoBox}>
            <Text style={s.infoBoxTitle}>Pagamento</Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Forma</Text>
              <Text style={s.infoValue}>{data.paymentWay || "—"}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Condições</Text>
              <Text style={s.infoValue}>{data.paymentTerms || "—"}</Text>
            </View>
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoBoxTitle}>Logística</Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Modalidade</Text>
              <Text style={s.infoValue}>{delivery}</Text>
            </View>
            {!data.isPickup && data.freight > 0 && (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Valor do frete</Text>
                <Text style={s.infoValue}>{fmt.currency(data.freight)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items table */}
        <View style={s.tableWrapper}>
          <Text style={s.tableTitle}>Itens do Pedido</Text>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, s.colProduct]}>Produto</Text>
            <Text style={[s.tableHeaderCell, s.colBoxType]}>Tipo de Caixa</Text>
            <Text style={[s.tableHeaderCell, s.colQty]}>Qtd</Text>
            <Text style={[s.tableHeaderCell, s.colPriceKg]}>Preço/kg</Text>
            <Text style={[s.tableHeaderCell, s.colWeight]}>Peso Total</Text>
            <Text style={[s.tableHeaderCell, s.colTotal]}>Valor</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={item.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <View style={s.colProduct}>
                <Text style={s.tableCell}>
                  {item.productName ?? `Produto #${item.productId}`}
                </Text>
              </View>
              <View style={s.colBoxType}>
                <Text style={[s.tableCellMuted, { fontSize: 9.5 }]}>
                  {BOX_TYPE_LABEL[item.boxType] ?? item.boxType}
                </Text>
              </View>
              <Text style={[s.tableCell, s.colQty, { fontSize: 10.5 }]}>{item.quantity}</Text>
              <Text style={[s.tableCell, s.colPriceKg]}>{fmt.currency(item.customPricePerKg)}</Text>
              <Text style={[s.tableCell, s.colWeight]}>{fmt.weight(item.totalWeight)}</Text>
              <Text style={[s.tableCell, s.colTotal, { fontFamily: "Helvetica-Bold", fontSize: 10.5 }]}>
                {fmt.currency(item.totalPrice)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsWrapper}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Total de caixas</Text>
              <Text style={s.totalsValue}>
                {data.items.reduce((sum, item) => sum + item.quantity, 0)} cx
              </Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Peso total</Text>
              <Text style={s.totalsValue}>{fmt.weight(data.totalWeight)}</Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{fmt.currency(data.subtotal)}</Text>
            </View>
            {data.discount > 0 && (
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Desconto ({data.discount}%)</Text>
                <Text style={s.totalsValue}>− {fmt.currency(data.discountAmount)}</Text>
              </View>
            )}
            {data.freight > 0 && !data.isPickup && (
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Frete</Text>
                <Text style={s.totalsValue}>+ {fmt.currency(data.freight)}</Text>
              </View>
            )}
            <View style={s.totalsLastRow}>
              <Text style={s.totalsFinalLabel}>TOTAL</Text>
              <Text style={s.totalsFinalValue}>{fmt.currency(data.totalPrice)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Gerado em {fmt.dateTime(data.generatedAt)}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
