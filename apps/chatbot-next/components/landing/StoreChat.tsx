"use client";

import { useState } from "react";
import type { SupportStoreCode } from "@rdx/chat-contract";
import ChatWidget from "@/components/chat/ChatWidget";
import { DEFAULT_STORE, STORES } from "@/lib/chat/constants";

export default function StoreChat() {
  const [store, setStore] = useState<SupportStoreCode>(DEFAULT_STORE);

  return (
    <>
      <label className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1.5 pr-2 pl-4 text-sm text-neutral-300 backdrop-blur">
        <span>Shopping from</span>
        <select
          value={store}
          onChange={(e) => setStore(e.target.value as SupportStoreCode)}
          className="cursor-pointer rounded-full border border-rdx-red/40 bg-rdx-black px-3 py-1.5 text-sm font-semibold text-white [color-scheme:dark] focus:border-rdx-red focus:outline-none"
        >
          {STORES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <ChatWidget store={store} />
    </>
  );
}
