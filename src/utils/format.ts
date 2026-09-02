export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

export const formatWeight = (value: number) =>
  `${new Intl.NumberFormat("pt-BR", { style: "decimal", minimumFractionDigits: 2 }).format(value)} kg`;

export const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${dateString}T00:00:00Z`),
  );


export const formatPartnerDuration = (startDate: string) => {
  const start = new Date(`${startDate}T00:00:00Z`);
  const today = new Date();
  let totalMonths =
    (today.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (today.getUTCMonth() - start.getUTCMonth());

  if (today.getUTCDate() < start.getUTCDate()) {
    totalMonths -= 1;
  }

  const years = Math.max(0, Math.floor(totalMonths / 12));
  const months = Math.max(0, totalMonths % 12);

  if (years === 0) {
    return `${months} ${months === 1 ? "mes" : "meses"}`;
  }

  if (months === 0) {
    return `${years} ${years === 1 ? "ano" : "anos"}`;
  }

  return `${years} ${years === 1 ? "ano" : "anos"} e ${months} ${months === 1 ? "mes" : "meses"}`;
};
