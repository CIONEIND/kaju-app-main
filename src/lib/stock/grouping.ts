import type { VirtualStock } from "@/app/services/product/types";

export type StockTotals = {
  physicalStock: number;
  reserved: number;
  available: number;
};

export type SubCategoryGroup = {
  subCategoria: string;
  items: VirtualStock[];
  totals: StockTotals;
};

export type CategoryGroup = {
  categoria: string;
  subCategories: SubCategoryGroup[];
  totals: StockTotals;
};

const CATEGORY_ORDER = ["Inteiras", "Quebradas", "Granulados", "Farinhas"];

export const formatQuantity = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    maximumFractionDigits: 2,
  }).format(value);

export function groupStock(items: VirtualStock[]): CategoryGroup[] {
  const catMap = new Map<string, Map<string, VirtualStock[]>>();

  for (const item of items) {
    const cat = item.categoria ?? "Sem Categoria";
    const sub = item.subCategoria ?? "Sem Subcategoria";

    if (!catMap.has(cat)) catMap.set(cat, new Map());
    const subMap = catMap.get(cat)!;
    if (!subMap.has(sub)) subMap.set(sub, []);
    subMap.get(sub)!.push(item);
  }

  const categories: CategoryGroup[] = [];

  for (const [categoria, subMap] of catMap) {
    const subCategories: SubCategoryGroup[] = [];

    for (const [subCategoria, subItems] of subMap) {
      subItems.sort((a, b) => a.name.localeCompare(b.name));

      const totals = subItems.reduce<StockTotals>(
        (acc, i) => ({
          physicalStock: acc.physicalStock + i.physicalStock,
          reserved: acc.reserved + i.reserved,
          available: acc.available + i.available,
        }),
        { physicalStock: 0, reserved: 0, available: 0 },
      );

      subCategories.push({ subCategoria, items: subItems, totals });
    }

    subCategories.sort((a, b) => a.subCategoria.localeCompare(b.subCategoria));

    const totals = subCategories.reduce<StockTotals>(
      (acc, s) => ({
        physicalStock: acc.physicalStock + s.totals.physicalStock,
        reserved: acc.reserved + s.totals.reserved,
        available: acc.available + s.totals.available,
      }),
      { physicalStock: 0, reserved: 0, available: 0 },
    );

    categories.push({ categoria, subCategories, totals });
  }

  categories.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.categoria);
    const bi = CATEGORY_ORDER.indexOf(b.categoria);
    if (ai === -1 && bi === -1) return a.categoria.localeCompare(b.categoria);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return categories;
}

export function computeGrandTotals(groups: CategoryGroup[]): StockTotals {
  return groups.reduce<StockTotals>(
    (acc, cat) => ({
      physicalStock: acc.physicalStock + cat.totals.physicalStock,
      reserved: acc.reserved + cat.totals.reserved,
      available: acc.available + cat.totals.available,
    }),
    { physicalStock: 0, reserved: 0, available: 0 },
  );
}
