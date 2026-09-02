// Paleta de cores para gráficos do dashboard.
// Usa OKLCH em harmonia com o accent (hue 248) do design system.

export const ACCENT = "oklch(55% 0.19 248)";

export const CHART_PALETTE = [
  "oklch(55% 0.19 248)", // azul accent
  "oklch(63% 0.13 195)", // teal
  "oklch(58% 0.18 290)", // violeta
  "oklch(72% 0.15 72)", // âmbar
  "oklch(62% 0.14 153)", // verde
  "oklch(62% 0.19 15)", // rosa/coral
  "oklch(66% 0.12 220)", // ciano
  "oklch(60% 0.16 330)", // magenta
] as const;

export const ORDER_STATUS_COLORS: Record<string, string> = {
  Confirmado: "oklch(62% 0.14 153)", // verde
  Orçamento: "oklch(72% 0.142 72)", // âmbar
  Cancelado: "oklch(62% 0.19 25)", // vermelho
};

export const FINANCIAL_STATUS_COLORS: Record<string, string> = {
  Pago: "oklch(62% 0.14 153)", // verde
  "Faturado via boleto": "oklch(58% 0.18 290)", // violeta
  "Aguardando pagamento": "oklch(72% 0.142 72)", // âmbar
};

export const STOCK_STATUS_COLORS: Record<string, string> = {
  "Estoque não reservado": "oklch(70% 0.02 248)", // cinza
  "Estoque reservado": "oklch(55% 0.19 248)", // azul accent
  "Produtos retirados": "oklch(62% 0.14 153)", // verde
};
