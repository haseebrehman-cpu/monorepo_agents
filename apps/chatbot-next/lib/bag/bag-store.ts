"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { SupportProduct, SupportStoreCode } from "@rdx/chat-contract";
import { readJson, writeJson } from "@/lib/chat/storage";

export interface BagLine {
  productId: string;
  title: string;
  url: string;
  imageUrl: string | null;
  priceFrom: number | null;
  currency: string;
  quantity: number;
}

const MAX_QUANTITY = 99;
const EMPTY: BagLine[] = [];
const bagKey = (store: SupportStoreCode) => `rdx-chat:bag:${store}`;

const cache = new Map<SupportStoreCode, BagLine[]>();
const listeners = new Set<() => void>();

function read(store: SupportStoreCode): BagLine[] {
  let lines = cache.get(store);
  if (!lines) {
    lines = readJson<BagLine[]>("local", bagKey(store)) ?? EMPTY;
    cache.set(store, lines);
  }
  return lines;
}

function write(store: SupportStoreCode, lines: BagLine[]): void {
  cache.set(store, lines);
  writeJson("local", bagKey(store), lines);
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  const onStorage = (event: StorageEvent) => {
    if (!event.key?.startsWith("rdx-chat:bag:")) return;
    cache.clear();
    notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

function toLine(product: SupportProduct, quantity: number): BagLine {
  return {
    productId: product.product_id,
    title: product.title,
    url: product.url,
    imageUrl: product.image_url,
    priceFrom: product.price_from,
    currency: product.currency,
    quantity,
  };
}

/** A per-store bag kept in localStorage and shared across tabs. */
export function useBag(store: SupportStoreCode) {
  const lines = useSyncExternalStore(
    subscribe,
    () => read(store),
    () => EMPTY,
  );

  const add = useCallback(
    (product: SupportProduct, quantity = 1) => {
      const current = read(store);
      const existing = current.find((line) => line.productId === product.product_id);
      write(
        store,
        existing
          ? current.map((line) =>
              line === existing
                ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_QUANTITY) }
                : line,
            )
          : [...current, toLine(product, quantity)],
      );
    },
    [store],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const clamped = Math.max(1, Math.min(quantity, MAX_QUANTITY));
      write(
        store,
        read(store).map((line) =>
          line.productId === productId ? { ...line, quantity: clamped } : line,
        ),
      );
    },
    [store],
  );

  const remove = useCallback(
    (productId: string) => {
      write(
        store,
        read(store).filter((line) => line.productId !== productId),
      );
    },
    [store],
  );

  const summary = useMemo(() => {
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    const priced = lines.filter((line) => line.priceFrom !== null);
    const subtotal = priced.reduce((sum, line) => sum + (line.priceFrom ?? 0) * line.quantity, 0);
    return {
      itemCount,
      subtotal: Math.round(subtotal * 100) / 100,
      currency: lines[0]?.currency ?? null,
      hasUnpriced: priced.length !== lines.length,
    };
  }, [lines]);

  return { lines, ...summary, add, setQuantity, remove };
}

export type Bag = ReturnType<typeof useBag>;
