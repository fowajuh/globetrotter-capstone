/**
 * Indicative FX rates (USD base), not live — there's no rates feed wired up
 * (see backend: no fx/rates module exists). Good enough to make the
 * Settings → Currency picker feel real across the app instead of only
 * updating a field nobody reads; not good enough for an actual booking
 * engine. Revisit if/when a real provider is added.
 */
const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  XAF: 605,
  NGN: 1550,
};

export const SUPPORTED_CURRENCIES = Object.keys(USD_RATES);

export function convertFromUsd(usd: number, currency: string): number {
  const rate = USD_RATES[currency] ?? 1;
  return usd * rate;
}

/** Whole-unit formatting (no cents) to match this app's existing terse
 *  nightly-rate style ("$142", not "$142.00") across every currency. */
export function formatMoney(usd: number, currency: string): string {
  const amount = convertFromUsd(usd, currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}
