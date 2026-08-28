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
      className="flex items-center gap-2 border-t border-neutral-200 bg-neutral-50 px-3 py-3"
    >
      <label htmlFor="chat-widget-input" className="sr-only">
        Message
      </label>
      <input
        id="chat-widget-input"
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask about gloves, sizes, gear… or M for menu"
        disabled={isTyping}
        maxLength={MAX_INPUT_CHARS}
        className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-rdx-red focus:ring-1 focus:ring-rdx-red focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={isTyping || !value.trim()}
        aria-label="Send message"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rdx-red text-white transition hover:bg-rdx-red-hover disabled:opacity-40"
      >
        <SendIcon />
      </button>
    </form>
  );
}
