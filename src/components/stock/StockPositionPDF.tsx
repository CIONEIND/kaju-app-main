import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  type CategoryGroup,
  formatQuantity,
  type StockTotals,
} from "@/lib/stock/grouping";

Font.registerHyphenationCallback((word) => [word]);

const BRAND = "#1e3a5f";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const RESERVED = "#b45309";
const SUCCESS = "#166534";
const DANGER = "#b91c1c";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#0f172a",
    paddingHorizontal: 40,
    paddingVertical: 40,
  },

  // Header
  headerBlock: {
    backgroundColor: BRAND,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: { flexDirection: "column", gap: 2 },
  companyName: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  companySubtitle: { fontSize: 8, color: "#93c5fd", letterSpacing: 0.3 },
  headerRight: { alignItems: "flex-end", gap: 3 },
  docTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 1,
  },
  docMeta: { fontSize: 8, color: "#93c5fd" },

  // Filter note
  filterNote: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 12,
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  categoryRow: {
    flexDirection: "row",
    backgroundColor: "#e8eef5",
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  categoryLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    flex: 1,
  },

  subCategoryRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 3.5,
    paddingHorizontal: 8,
  },
  subCategoryLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flex: 1,
  },

  itemRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  itemName: { fontSize: 8.5, color: "#0f172a", paddingLeft: 8 },

  subtotalRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: "#fafafa",
  },
  subtotalLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    paddingLeft: 8,
  },

  // Cells
  colName: { flex: 3 },
  colNum: { width: 80, textAlign: "right" },
  cellNum: { fontSize: 8.5, textAlign: "right" },
  cellNumBold: {
    fontSize: 8.5,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },

  // Grand totals
  totalsWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  totalsBox: {
    width: 280,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    overflow: "hidden",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  totalsLastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: BRAND,
  },
  totalsLabel: { fontSize: 8, color: MUTED },
  totalsValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  totalsFinalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  totalsFinalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#93c5fd",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: MUTED },
});

const fmt = {
  dateTime: (iso: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso)),
};

const availableColor = (value: number) => (value < 0 ? DANGER : SUCCESS);

export interface StockPositionPDFData {
  groups: CategoryGroup[];
  grandTotals: StockTotals;
  productCount: number;
  onlyAvailable: boolean;
  searchQuery?: string;
  generatedAt: string;
}

function TotalsCells({
  totals,
  bold,
}: {
  totals: StockTotals;
  bold?: boolean;
}) {
  const numStyle = bold ? s.cellNumBold : s.cellNum;
  return (
    <>
      <Text style={[numStyle, s.colNum]}>
        {formatQuantity(totals.physicalStock)}
      </Text>
      <Text style={[numStyle, s.colNum, { color: RESERVED }]}>
        {formatQuantity(totals.reserved)}
      </Text>
      <Text
        style={[
          numStyle,
          s.colNum,
          { color: availableColor(totals.available) },
        ]}
      >
        {formatQuantity(totals.available)}
      </Text>
    </>
  );
}

export function StockPositionDocument({
  data,
}: {
  data: StockPositionPDFData;
}) {
  const filterParts: string[] = [];
  if (data.onlyAvailable) filterParts.push("Apenas produtos disponíveis");
  if (data.searchQuery?.trim())
    filterParts.push(`Filtro: "${data.searchQuery.trim()}"`);
  const filterNote =
    filterParts.length > 0
      ? filterParts.join(" · ")
      : "Todos os produtos e categorias";

  return (
    <Document title="Posição de estoque" author="Cione">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerBlock}>
          <View style={s.headerLeft}>
            <Text style={s.companyName}>CIONE</Text>
            <Text style={s.companySubtitle}>Perene como o cajueiro</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.docTitle}>POSIÇÃO DE ESTOQUE</Text>
            <Text style={s.docMeta}>
              {data.productCount} produto{data.productCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <Text style={s.filterNote}>{filterNote}</Text>

        {/* Table header (repeats on each page) */}
        <View style={s.tableHeader} fixed>
          <Text style={[s.tableHeaderCell, s.colName]}>Produto</Text>
          <Text style={[s.tableHeaderCell, s.colNum]}>Estoque físico</Text>
          <Text style={[s.tableHeaderCell, s.colNum]}>Reservado</Text>
          <Text style={[s.tableHeaderCell, s.colNum]}>Disponível</Text>
        </View>

        {/* Groups */}
        {data.groups.map((cat) => (
          <View key={cat.categoria} wrap>
            <View style={s.categoryRow}>
              <Text style={s.categoryLabel}>{cat.categoria}</Text>
              <TotalsCells totals={cat.totals} bold />
            </View>

            {cat.subCategories.map((sub) => (
              <View key={`${cat.categoria}::${sub.subCategoria}`} wrap>
                <View style={s.subCategoryRow}>
                  <Text style={s.subCategoryLabel}>
                    {sub.subCategoria} ({sub.items.length})
                  </Text>
                </View>

                {sub.items.map((item) => (
                  <View key={item.id} style={s.itemRow} wrap={false}>
                    <Text style={[s.itemName, s.colName]}>{item.name}</Text>
                    <Text style={[s.cellNum, s.colNum]}>
                      {formatQuantity(item.physicalStock)}
                    </Text>
                    <Text style={[s.cellNum, s.colNum, { color: RESERVED }]}>
                      {formatQuantity(item.reserved)}
                    </Text>
                    <Text
                      style={[
                        s.cellNumBold,
                        s.colNum,
                        { color: availableColor(item.available) },
                      ]}
                    >
                      {formatQuantity(item.available)}
                    </Text>
                  </View>
                ))}

                <View style={s.subtotalRow} wrap={false}>
                  <Text style={[s.subtotalLabel, s.colName]}>
                    Subtotal — {sub.subCategoria}
                  </Text>
                  <TotalsCells totals={sub.totals} bold />
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Grand totals */}
        <View style={s.totalsWrapper} wrap={false}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Estoque físico total</Text>
              <Text style={s.totalsValue}>
                {formatQuantity(data.grandTotals.physicalStock)}
              </Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Reservado total</Text>
              <Text style={[s.totalsValue, { color: RESERVED }]}>
                {formatQuantity(data.grandTotals.reserved)}
              </Text>
            </View>
            <View style={s.totalsLastRow}>
              <Text style={s.totalsFinalLabel}>DISPONÍVEL TOTAL</Text>
              <Text style={s.totalsFinalValue}>
                {formatQuantity(data.grandTotals.available)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Gerado em {fmt.dateTime(data.generatedAt)}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
