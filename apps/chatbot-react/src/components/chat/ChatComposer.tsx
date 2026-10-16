import type { Ref } from "react";
import { SendIcon } from "@rdx/ui";
import { MAX_INPUT_CHARS } from "./constants";

interface ChatComposerProps {
  value: string;
  isTyping: boolean;
  inputRef: Ref<HTMLInputElement>;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function ChatComposer({
  value,
  isTyping,
  inputRef,
  onChange,
  onSubmit,
}: ChatComposerProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex w-full items-center gap-2 border-t border-neutral-200 bg-neutral-50 px-3 py-3"
    >
      <label htmlFor="chat-widget-input" className="sr-only">
        Message
      </label>
      <div className="relative min-w-0 flex-1">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 16.5 4.5 20l4-2.2"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 16.5h8.2A4.3 4.3 0 0 0 19.5 12 6.5 6.5 0 1 0 7.2 8.2 4.2 4.2 0 0 0 7 16.5Z"
          />
        </svg>
        <input
          id="chat-widget-input"
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask about products, orders, sizes..."
          disabled={isTyping}
          maxLength={MAX_INPUT_CHARS}
          className="rdx-chat-input w-full rounded-full border border-neutral-300 bg-white py-2 pr-4 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-rdx-red focus:ring-1 focus:ring-rdx-red focus:outline-none disabled:opacity-60"
        />
      </div>
      <button
        type="submit"
        disabled={isTyping || !value.trim()}
        aria-label="Send message"
        className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rdx-red text-white transition hover:bg-rdx-red-hover disabled:opacity-40"
      >
        <SendIcon />
      </button>
    </form>
  );
}
