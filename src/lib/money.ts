export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function parseCurrencyToCents(value: string) {
  const raw = value.replace(/\s|R\$/gi, "").trim();

  if (!raw) {
    return Number.NaN;
  }

  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;

  return Math.round(Number(normalized) * 100);
}

export function splitIntoEqualInstallments(totalCents: number, installments: number) {
  return Math.round(totalCents / installments);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}
