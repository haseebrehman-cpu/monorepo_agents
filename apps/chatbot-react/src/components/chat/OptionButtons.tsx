import { OPTIONS } from "./constants";
import type { ChatOption } from "@rdx/chat-contract";

interface OptionButtonsProps {
  disabled: boolean;
  onSelect: (option: ChatOption) => void;
}

export default function OptionButtons({
  disabled,
  onSelect,
}: OptionButtonsProps) {
  return (
    <div
      className="mt-3 flex flex-col items-start gap-2"
      role="group"
      aria-label="Quick options"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option)}
          disabled={disabled || !option.enabled}
          aria-disabled={!option.enabled || disabled}
          className={
            option.enabled
              ? "rounded-full border border-rdx-red bg-white px-3.5 py-1.5 text-sm font-semibold text-rdx-red transition hover:bg-rdx-red hover:text-white disabled:opacity-50"
              : "rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-sm text-neutral-500 disabled:opacity-50"
          }
        >
          {option.label}
          {!option.enabled && (
            <span className="ml-1.5 text-[10px] tracking-wide text-slate-400 uppercase">
              soon
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
