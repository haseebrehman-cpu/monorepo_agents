import StoreChat from "@/components/landing/StoreChat";

const FEATURES = [
  { title: "Find the right gear", text: "Gloves, belts, bags and more — matched to how you train." },
  { title: "Nail the fit", text: "Instant sizing advice so your first order is the right one." },
  { title: "Track & return", text: "Order updates, returns and a real person when you need one." },
];

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-rdx-black text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(225,6,0,0.32),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(225,6,0,0.12),transparent_40%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        aria-hidden="true"
      />

      <section className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="rounded-full border border-rdx-red/40 bg-rdx-red/10 px-3 py-1 font-display text-[11px] font-semibold tracking-[0.24em] text-rdx-red uppercase">
          Boxing · MMA · Fitness
        </span>
        <h1 className="mt-6 font-display text-5xl font-bold tracking-[0.06em] uppercase sm:text-7xl">
          RDX <span className="text-rdx-red">Sports</span>
        </h1>
        <p className="mt-3 font-display text-lg tracking-[0.3em] text-neutral-300 uppercase">
          Shopping Assistant
        </p>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-400">
          Need the right gloves, bag, or size? Tap the RDX chat icon in the corner for
          instant answers on gear, fit, and availability.
        </p>

        <StoreChat />

        <ul className="mt-14 grid w-full gap-3 text-left sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
            >
              <p className="font-display text-sm font-semibold tracking-[0.12em] uppercase">
                {feature.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
