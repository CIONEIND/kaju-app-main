export function hojeBR(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Fortaleza",
  }).format(new Date());
}