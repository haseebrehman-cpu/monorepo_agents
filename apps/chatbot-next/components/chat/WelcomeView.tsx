import Image from "next/image";
import type { ComponentType, SVGProps } from "react";
import {
  CHATBOT_ICON_SRC,
  MENU_OPTIONS,
  POPULAR_QUESTIONS,
  STORE_NAME,
  storeOption,
  type MenuOption,
  type MenuOptionId,
  type QuickQuestion,
} from "@/lib/chat/constants";
import type { SupportStoreCode } from "@rdx/chat-contract";
import {
  BoxIcon,
  ChevronRightIcon,
  HeadsetIcon,
  ReturnIcon,
  SearchIcon,
  ShieldAlertIcon,
  SparkIcon,
} from "./icons";

const MENU_ICONS: Record<MenuOptionId, ComponentType<SVGProps<SVGSVGElement>>> = {
  "product-info": SearchIcon,
  "track-order": BoxIcon,
  "refund-return": ReturnIcon,
  "damaged-product": ShieldAlertIcon,
  "talk-human": HeadsetIcon,
};

interface WelcomeViewProps {
  store: SupportStoreCode;
  disabled: boolean;
  compact?: boolean;
  onSelect: (option: MenuOption) => void;
  onQuestion: (question: QuickQuestion) => void;
}

export default function WelcomeView({
  store,
  disabled,
  compact = false,
  onSelect,
  onQuestion,
}: WelcomeViewProps) {
  const regionLabel = storeOption(store).label;

  return (
    <div className="animate-rdx-rise space-y-3">
      {!compact && (
        <section className="relative overflow-hidden rounded-2xl bg-rdx-black px-4 py-4 text-white">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(225,6,0,0.45),transparent_60%)]"
            aria-hidden="true"
          />
          <div className="relative flex items-start gap-3">
            <Image
              src={CHATBOT_ICON_SRC}
              alt=""
              width={96}
              height={96}
              className="h-12 w-12 shrink-0 rounded-full bg-[#e7e7e9] object-contain ring-2 ring-rdx-red"
            />
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold tracking-wide uppercase">
                Hi there <span aria-hidden="true">👋</span>
              </h2>
              <p className="mt-0.5 text-[13px] leading-snug text-neutral-300">
                I&apos;m the {STORE_NAME} {regionLabel} assistant. I can help you find the
                right gear, check sizes, track orders and more.
              </p>
            </div>
          </div>
        </section>
      )}

      <section aria-label="How can we help">
        <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
          How can we help?
        </p>
        <div className="grid grid-cols-2 gap-2 group-data-[expanded=true]/panel:grid-cols-3">
          {MENU_OPTIONS.map((option, index) => {
            const Glyph = MENU_ICONS[option.id];
            const isLast = index === MENU_OPTIONS.length - 1;
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(option)}
                className={`group/card flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:border-rdx-red/40 hover:shadow-[0_8px_20px_rgba(225,6,0,0.08)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${
                  isLast ? "col-span-2 group-data-[expanded=true]/panel:col-span-1" : ""
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rdx-red/10 text-rdx-red transition group-hover/card:bg-rdx-red group-hover/card:text-white">
                  <Glyph className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] leading-tight font-semibold text-neutral-900">
                    {option.label}
                  </span>
                  <span className="mt-0.5 hidden text-xs leading-snug text-neutral-500 group-data-[expanded=true]/panel:block">
                    {option.description}
                  </span>
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-neutral-300 transition group-hover/card:translate-x-0.5 group-hover/card:text-rdx-red" />
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Popular questions">
        <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
          <SparkIcon className="h-3.5 w-3.5 text-rdx-red" />
          Popular right now
        </p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_QUESTIONS.map((question) => (
            <button
              key={question.id}
              type="button"
              disabled={disabled}
              onClick={() => onQuestion(question)}
              className="cursor-pointer rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-rdx-red hover:bg-rdx-red hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {question.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
