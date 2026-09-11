const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  CAD: "CA$",
  EUR: "€",
  AED: "AED ",
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `;
}

export function formatDecimalPrice(
  value: string | null | undefined,
  currency: string,
): string | null {
  if (!value) return null;
  return `${currencySymbol(currency)}${value}`;
}

export function formatMinorUnits(
  amount: number | null | undefined,
  currency: string,
): string | null {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return null;
  }
  return `${currencySymbol(currency)}${(amount / 100).toFixed(2)}`;
}
