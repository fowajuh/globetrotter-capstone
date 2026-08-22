import { formatMoney } from "@/lib/currency";
import { useHomeCurrency } from "@/lib/use-home-currency";

/** Drop-in replacement for `${usd}` price text anywhere in the app —
 *  renders in whatever currency Settings → Currency is set to. */
export function Price({ usd, className }: { usd: number; className?: string }) {
  const currency = useHomeCurrency();
  return <span className={className}>{formatMoney(usd, currency)}</span>;
}
