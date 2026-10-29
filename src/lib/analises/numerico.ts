/** Sanitiza enquanto digita: só dígitos, um separador, no máximo N casas. */
export function sanitizarDecimal(
  entrada: string,
  decimais = 2,
  permitirNegativo = false,
): string {
  let v = entrada.replace(/[^\d.,-]/g, "");
  const negativo = permitirNegativo && v.trimStart().startsWith("-");
  v = v.replace(/-/g, "").replace(/\./g, ","); // normaliza ponto para vírgula

  const temSeparador = v.includes(",");
  const [inteiraBruta = "", ...resto] = v.split(",");
  const inteira = inteiraBruta.replace(/^0+(?=\d)/, ""); // "007" -> "7"
  const fracao = resto.join("").slice(0, decimais);
  const sinal = negativo ? "-" : "";

  return temSeparador ? `${sinal}${inteira},${fracao}` : `${sinal}${inteira}`;
}

/** Normaliza ao sair do campo: ",5" -> "0,5"; "5," -> "5"; "5" -> "5,00". */
export function finalizarDecimal(valor: string, decimais = 2): string {
  if (valor === "" || valor === "-") return "";
  let v = valor.replace(/,+$/, "");
  if (v.startsWith(",")) v = `0${v}`;
  if (v.endsWith(",")) v = v.slice(0, -1);
  const [inteira, fracao = ""] = v.split(",");
  return `${inteira},${fracao.padEnd(decimais, "0").slice(0, decimais)}`;
}

/** Converte o texto mascarado em número (ou null se vazio). */
export function paraNumero(texto: string): number | null {
  const limpo = texto.trim().replace(/\./g, "").replace(",", ".");
  if (limpo === "" || limpo === "-") return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

/** Número do banco para texto do input: 5 -> "5,00". */
export function paraTexto(valor: number | null | undefined, decimais = 2): string {
  if (valor === null || valor === undefined) return "";
  return valor.toFixed(decimais).replace(".", ",");
}

/** ISO "2026-10-28" -> "28/10/2026". Sem Date, sem fuso. */
export function formatarDataBR(iso: string): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}