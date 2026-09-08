import ChatWidget from "@/components/chat/ChatWidget";
import SelectRegion from "./components/chat/SelectRegion";
import { useState } from "react";

export default function App() {
  const [region, setRegion] = useState('uk');
  
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-rdx-black px-6 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,6,0,0.28),transparent_42%),linear-gradient(180deg,#0a0a0a_0%,#141414_100%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center text-center">
        <span className="mb-5 rounded-full border border-rdx-red/40 bg-rdx-red/10 px-3 py-1 font-display text-[11px] font-semibold tracking-[0.22em] text-rdx-red uppercase">
          Boxing · MMA · Fitness
        </span>
        <h1 className="font-display max-w-2xl text-4xl font-bold tracking-[0.08em] uppercase sm:text-6xl">
          RDX Sports
        </h1>
        <p className="mt-2 font-display text-lg tracking-[0.28em] text-rdx-red uppercase">
          Shopping Assistant
        </p>
        <SelectRegion region={region} setRegion={setRegion} />
        <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-300">
          Need the right gloves, bag, or size? Tap the RDX chat icon in the
          corner for instant answers on gear, fit, and availability.
        </p>
      </div>
      <ChatWidget region={region} />
    </main>
  );
}
