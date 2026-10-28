"use client";

import { forwardRef } from "react";
import {
    type CategoryGroup,
    formatQuantity,
    type StockTotals,
} from "@/lib/stock/grouping";
import type { StockPositionPDFData } from "./StockPositionPDF";

const LARGURA = 920;
const COL = 108;

const BRAND = "#1e3a5f";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const TEXT = "#0f172a";
const SUCCESS = "#15803d";
const DANGER = "#b91c1c";
const RESERVED = "#b45309";

const linha: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "5px 12px",
    borderBottom: `1px solid ${BORDER}`,
};

function TotalCells({ totals, bold }: { totals: StockTotals; bold?: boolean }) {
    const peso = bold ? 700 : 400;
    return (
        <>
            <span style={{ width: COL, textAlign: "right", fontWeight: peso }}>
                {formatQuantity(totals.physicalStock)}
            </span>
            <span style={{ width: COL, textAlign: "right", fontWeight: peso, color: RESERVED }}>
                {formatQuantity(totals.reserved)}
            </span>
            <span
                style={{
                    width: COL,
                    textAlign: "right",
                    fontWeight: peso,
                    color: totals.available < 0 ? DANGER : SUCCESS,
                }}
            >
                {formatQuantity(totals.available)}
            </span>
        </>
    );
}

function fmtData(iso: string): string {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(iso));
}

export const StockPositionReportImage = forwardRef<
    HTMLDivElement,
    { data: StockPositionPDFData }
>(function StockPositionReportImage({ data }, ref) {
    const filtros: string[] = [];
    if (data.onlyAvailable) filtros.push("Apenas produtos disponíveis");
    if (data.searchQuery?.trim()) filtros.push(`Filtro: "${data.searchQuery.trim()}"`);

    return (
        <div
            ref={ref}
            style={{
                width: LARGURA,
                backgroundColor: "#ffffff",
                padding: 28,
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: 11,
                lineHeight: 1.45,
                color: TEXT,
                boxSizing: "border-box",
            }}
        >
            <div style={{ fontSize: 19, fontWeight: 700, color: BRAND }}>
                Posição de Estoque
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                {data.productCount} produto{data.productCount !== 1 ? "s" : ""}
            </div>
            {filtros.length > 0 && (
                <div style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>
                    {filtros.join(" · ")}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    backgroundColor: BRAND,
                    padding: "7px 12px",
                    marginTop: 14,
                    borderRadius: 4,
                    color: "#ffffff",
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                }}
            >
                <span style={{ flex: 1 }}>Produto</span>
                <span style={{ width: COL, textAlign: "right" }}>Estoque físico</span>
                <span style={{ width: COL, textAlign: "right" }}>Reservado</span>
                <span style={{ width: COL, textAlign: "right" }}>Disponível</span>
            </div>

            {data.groups.map((cat) => (
                <div key={cat.categoria}>
                    <div
                        style={{
                            ...linha,
                            backgroundColor: "#e8eef5",
                            marginTop: 6,
                            borderBottom: "none",
                        }}
                    >
                        <span
                            style={{
                                flex: 1,
                                fontWeight: 700,
                                color: BRAND,
                                textTransform: "uppercase",
                                fontSize: 10,
                            }}
                        >
                            {cat.categoria}
                        </span>
                        <TotalCells totals={cat.totals} bold />
                    </div>

                    {cat.subCategories.map((sub) => (
                        <div key={`${cat.categoria}::${sub.subCategoria}`}>
                            <div style={{ ...linha, backgroundColor: "#f1f5f9", borderBottom: "none", padding: "4px 12px" }}>
                                <span
                                    style={{
                                        flex: 1,
                                        fontWeight: 700,
                                        color: MUTED,
                                        textTransform: "uppercase",
                                        fontSize: 9,
                                    }}
                                >
                                    {sub.subCategoria} ({sub.items.length})
                                </span>
                            </div>

                            {sub.items.map((item) => (
                                <div key={item.id} style={linha}>
                                    <span style={{ flex: 1, paddingLeft: 8 }}>{item.name}</span>
                                    <span style={{ width: COL, textAlign: "right" }}>
                                        {formatQuantity(item.physicalStock)}
                                    </span>
                                    <span style={{ width: COL, textAlign: "right", color: RESERVED }}>
                                        {formatQuantity(item.reserved)}
                                    </span>
                                    <span
                                        style={{
                                            width: COL,
                                            textAlign: "right",
                                            color: item.available < 0 ? DANGER : SUCCESS,
                                        }}
                                    >
                                        {formatQuantity(item.available)}
                                    </span>
                                </div>
                            ))}

                            <div style={{ ...linha, backgroundColor: "#fafafa" }}>
                                <span style={{ flex: 1, fontWeight: 700, color: MUTED, paddingLeft: 8, fontSize: 10 }}>
                                    Subtotal — {sub.subCategoria}
                                </span>
                                <TotalCells totals={sub.totals} bold />
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <div style={{ width: 320, border: `1px solid ${BORDER}`, borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 12px", borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ color: MUTED }}>Estoque físico total</span>
                        <span style={{ fontWeight: 700 }}>{formatQuantity(data.grandTotals.physicalStock)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 12px", borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ color: MUTED }}>Reservado total</span>
                        <span style={{ fontWeight: 700, color: RESERVED }}>{formatQuantity(data.grandTotals.reserved)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: BRAND }}>
                        <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 11 }}>DISPONÍVEL TOTAL</span>
                        <span style={{ color: "#93c5fd", fontWeight: 700, fontSize: 13 }}>
                            {formatQuantity(data.grandTotals.available)}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 16, fontSize: 9, color: MUTED }}>
                Gerado em {fmtData(data.generatedAt)}
            </div>
        </div>
    );
});