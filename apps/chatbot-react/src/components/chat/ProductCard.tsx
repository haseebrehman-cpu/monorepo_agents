import type { ChatProductCard } from "@rdx/chat-contract";
import { isAllowedChatHref } from "@/lib/url-allowlist";

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  CAD: "CA$",
  EUR: "€",
  AED: "AED ",
};

function formatPrice(value: string | null, currency: string): string | null {
  if (!value) return null;
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${value}`;
}

export default function ProductCard({ product }: { product: ChatProductCard }) {
  const current = formatPrice(product.price_min, product.price_currency);
  const compare = formatPrice(product.compare_at_min, product.price_currency);
  const showWas =
    product.compare_at_min !== null &&
    product.price_min !== null &&
    Number.parseFloat(product.compare_at_min) >
      Number.parseFloat(product.price_min);
  const href = isAllowedChatHref(product.url) ? product.url : null;
  const promotion = product.promotions?.[0];

  return (
    <article className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left">
      <h3 className="text-[13px] font-semibold text-slate-900">{product.title}</h3>
      {current && (
        <p className="mt-1 text-[13px] text-slate-800">
          <span className="font-semibold">{current}</span>
          {product.price_max &&
            product.price_min &&
            product.price_max !== product.price_min && (
              <span className="text-slate-600">
                {" "}
                – {formatPrice(product.price_max, product.price_currency)}
              </span>
            )}
          {showWas && compare && (
            <span className="ml-2 text-slate-400 line-through">{compare}</span>
          )}
        </p>
      )}
      {product.stock_status && (
        <p className="mt-0.5 text-[12px] text-slate-600">{product.stock_status}</p>
      )}
      {promotion && (
        <p className="mt-0.5 text-[12px] font-medium text-rdx-red">{promotion}</p>
      )}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-[12px] font-medium text-rdx-red underline underline-offset-2 hover:text-rdx-red-hover"
        >
          View product
        </a>
      )}
    </article>
  );
}
