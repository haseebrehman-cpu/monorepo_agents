import Image from "next/image";
import type { SupportProduct } from "@rdx/chat-contract";
import { cn } from "@rdx/ui/lib/utils";
import { formatMoney } from "@/lib/chat/format";
import { isSafeHref } from "@/lib/chat/links";
import { BagIcon, CheckIcon, GloveGlyph } from "./icons";

interface ProductCardProps {
  product: SupportProduct;
  quantityInBag: number;
  onAdd: (product: SupportProduct) => void;
  onView: (product: SupportProduct) => void;
}

export default function ProductCard({ product, quantityInBag, onAdd, onView }: ProductCardProps) {
  const href = isSafeHref(product.url) ? product.url : null;
  const image = product.image_url && isSafeHref(product.image_url) ? product.image_url : null;
  const soldOut = product.available === false;
  const inBag = quantityInBag > 0;

  return (
    <article className="flex w-52 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] group-data-[expanded=true]/panel:w-auto">
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-200">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            unoptimized
            sizes="208px"
            className="object-contain p-2"
          />
        ) : (
          <GloveGlyph className="h-16 w-16 drop-shadow-md" />
        )}
        {product.product_type && (
          <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-neutral-700 shadow-sm">
            {product.product_type}
          </span>
        )}
        {soldOut && (
          <span className="absolute top-2 right-2 rounded-full bg-neutral-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-[13px] leading-snug font-semibold text-neutral-900">
          {product.title}
        </h3>
        <p className="mt-1 text-sm font-bold text-neutral-900">
          {product.price_from !== null ? (
            <>
              <span className="mr-1 text-[11px] font-medium text-neutral-500">From</span>
              {formatMoney(product.price_from, product.currency)}
            </>
          ) : (
            <span className="text-xs font-medium text-neutral-500">See product page</span>
          )}
        </p>
        {product.available === true && (
          <p className="mt-0.5 text-[11px] font-medium text-emerald-600">In stock</p>
        )}

        <div className="mt-auto flex gap-1.5 pt-3">
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onView(product)}
              className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              View
            </a>
          )}
          <button
            type="button"
            disabled={soldOut}
            onClick={() => onAdd(product)}
            className={cn(
              "inline-flex h-8 flex-[1.6] cursor-pointer items-center justify-center gap-1.5 rounded-lg text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-45",
              inBag
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-rdx-red text-white hover:bg-rdx-red-hover",
            )}
          >
            {inBag ? <CheckIcon className="h-3.5 w-3.5" /> : <BagIcon className="h-3.5 w-3.5" />}
            {soldOut ? "Sold out" : inBag ? `In bag · ${quantityInBag}` : "Add to bag"}
          </button>
        </div>
      </div>
    </article>
  );
}
