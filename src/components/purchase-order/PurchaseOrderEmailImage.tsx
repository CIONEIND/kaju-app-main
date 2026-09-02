import type { PurchaseOrderPDFData } from "./PurchaseOrderPDF";

const BRAND = "#1e3a5f";
const BRAND_LIGHT = "#e8eef5";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const ROW_ALT = "#f8fafc";

const BOX_TYPE_LABEL: Record<string, string> = {
  FULL: "22,68 kg — Caixa Completa",
  HALF: "11,34 kg — Meia Caixa",
};

const FREIGHT_TYPE_LABEL: Record<string, string> = {
  fob: "FOB — Frete por conta do comprador",
  cif: "CIF — Frete por conta do vendedor",
};

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

function InfoBox({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div style={{ flex: 1, backgroundColor: BRAND_LIGHT, borderRadius: 6, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: BRAND, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid #bfdbfe` }}>
        {title}
      </div>
      {rows.map((row) => (
        <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: MUTED }}>{row.label}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", textAlign: "right" as const, maxWidth: "60%" }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function PurchaseOrderEmailImage({ data }: { data: PurchaseOrderPDFData }) {
  const delivery = data.isPickup
    ? "Retirada pelo comprador"
    : FREIGHT_TYPE_LABEL[data.freightType] ?? data.freightType;

  return (
    <div style={{ width: 680, backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#0f172a" }}>
      {/* Header */}
      <div style={{ backgroundColor: BRAND, borderRadius: "8px 8px 0 0", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", letterSpacing: 0.5 }}>CIONE</div>
          <div style={{ fontSize: 11, color: "#93c5fd", marginTop: 3 }}>Perene como o cajueiro</div>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", letterSpacing: 1, textTransform: "uppercase" as const }}>Pedido de Compra</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#93c5fd", marginTop: 2 }}>#{data.number}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px", border: `1px solid ${BORDER}`, borderTop: "none", borderRadius: "0 0 8px 8px" }}>
        {/* Info row 1 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 2, backgroundColor: BRAND_LIGHT, borderRadius: 6, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: BRAND, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #bfdbfe" }}>
              Cliente
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{data.clientName}</div>
            {data.clientCnpj && (
              <div style={{ fontSize: 11, color: MUTED }}>CNPJ: {data.clientCnpj}</div>
            )}
          </div>
          <InfoBox
            title="Pedido"
            rows={[
              { label: "Data de emissão", value: fmt.date(data.date) },
              { label: "Status", value: data.orderStatus },
              { label: "Financeiro", value: data.financialStatus },
            ]}
          />
        </div>

        {/* Info row 2 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <InfoBox
            title="Pagamento"
            rows={[
              { label: "Forma", value: data.paymentWay || "—" },
              { label: "Condições", value: data.paymentTerms || "—" },
            ]}
          />
          <InfoBox
            title="Logística"
            rows={[
              { label: "Modalidade", value: delivery },
              ...((!data.isPickup && data.freight > 0)
                ? [{ label: "Valor do frete", value: fmt.currency(data.freight) }]
                : []),
            ]}
          />
        </div>

        {/* Items table */}
        <div style={{ fontSize: 10, fontWeight: 700, color: BRAND, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>
          Itens do Pedido
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, marginBottom: 16 }}>
          <thead>
            <tr style={{ backgroundColor: BRAND }}>
              <th style={{ padding: "8px 10px", textAlign: "left" as const, fontSize: 10, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Produto</th>
              <th style={{ padding: "8px 10px", textAlign: "left" as const, fontSize: 10, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Tipo de Caixa</th>
              <th style={{ padding: "8px 10px", textAlign: "center" as const, fontSize: 10, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" as const, letterSpacing: 0.5, width: 50 }}>Qtd</th>
              <th style={{ padding: "8px 10px", textAlign: "right" as const, fontSize: 10, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" as const, letterSpacing: 0.5, width: 72 }}>Preço/kg</th>
              <th style={{ padding: "8px 10px", textAlign: "right" as const, fontSize: 10, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" as const, letterSpacing: 0.5, width: 80 }}>Peso Total</th>
              <th style={{ padding: "8px 10px", textAlign: "right" as const, fontSize: 10, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" as const, letterSpacing: 0.5, width: 82 }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={item.id} style={{ backgroundColor: i % 2 === 1 ? ROW_ALT : "#ffffff", borderBottom: `1px solid ${BORDER}` }}>
                <td style={{ padding: "7px 10px", fontSize: 12, color: "#0f172a" }}>{item.productName ?? `Produto #${item.productId}`}</td>
                <td style={{ padding: "7px 10px", fontSize: 13, color: MUTED }}>{BOX_TYPE_LABEL[item.boxType] ?? item.boxType}</td>
                <td style={{ padding: "7px 10px", fontSize: 14, color: "#0f172a", textAlign: "center" as const }}>{item.quantity}</td>
                <td style={{ padding: "7px 10px", fontSize: 12, color: "#0f172a", textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{fmt.currency(item.customPricePerKg)}</td>
                <td style={{ padding: "7px 10px", fontSize: 12, color: "#0f172a", textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{fmt.weight(item.totalWeight)}</td>
                <td style={{ padding: "7px 10px", fontSize: 14, fontWeight: 700, color: "#0f172a", textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{fmt.currency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <div style={{ width: 240, border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 12, color: MUTED }}>Total de caixas</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{data.items.reduce((sum, item) => sum + item.quantity, 0)} cx</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 12, color: MUTED }}>Peso total</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{fmt.weight(data.totalWeight)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 12, color: MUTED }}>Subtotal</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{fmt.currency(data.subtotal)}</span>
            </div>
            {data.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 12, color: MUTED }}>Desconto ({data.discount}%)</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>− {fmt.currency(data.discountAmount)}</span>
              </div>
            )}
            {data.freight > 0 && !data.isPickup && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 12, color: MUTED }}>Frete</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>+ {fmt.currency(data.freight)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", backgroundColor: BRAND }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>TOTAL</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#93c5fd" }}>{fmt.currency(data.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: MUTED }}>Gerado em {fmt.dateTime(data.generatedAt)}</span>
          <span style={{ fontSize: 10, color: MUTED }}>cione.com.br</span>
        </div>
      </div>
    </div>
  );
}
