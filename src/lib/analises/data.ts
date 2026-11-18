/** Fuso oficial da operação — deve coincidir com o TZ do container */
export const FUSO_OPERACAO = "America/Fortaleza";

/**
 * Data de hoje no fuso da operação, no formato yyyy-mm-dd.
 *
 * Usa Intl em vez de toISOString() porque toISOString() sempre devolve UTC:
 * às 22h de 17/11 em Fortaleza, toISOString() já retorna 18/11.
 */
export function hojeBR(base: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: FUSO_OPERACAO,
  }).format(base);
}

/** Hora atual no fuso da operação, no formato HH:mm */
export function agoraBR(base: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_OPERACAO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(base);
}

/** 2026-11-18T21:51:00Z → "18/11/2026 21:51" */
export function dataHoraBR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const data = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_OPERACAO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);

  const hora = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_OPERACAO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  return `${data} ${hora}`;
}

/** Converte yyyy-mm-dd para dd/mm/aaaa sem passar por Date */
export function dataBR(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}