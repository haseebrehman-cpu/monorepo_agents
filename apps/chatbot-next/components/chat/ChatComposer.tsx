import { useLayoutEffect, type KeyboardEvent, type RefObject } from "react";
import { MAX_INPUT_CHARS } from "@/lib/chat/constants";
import { SendIcon } from "./icons";

interface ChatComposerProps {
  value: string;
  isTyping: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

const MAX_HEIGHT_PX = 120;

export default function ChatComposer({
  value,
  isTyping,
  inputRef,
  onChange,
  onSubmit,
  placeholder = "Ask about products, orders, sizes…",
}: ChatComposerProps) {
  useLayoutEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value, inputRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSubmit();
    }
  };

  const canSend = !isTyping && value.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="border-t border-neutral-200 bg-white px-3 pt-3 pb-2"
    >
      <div className="mx-auto flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 py-1.5 pr-1.5 pl-3.5 transition focus-within:border-rdx-red focus-within:bg-white focus-within:ring-2 focus-within:ring-rdx-red/15 group-data-[expanded=true]/panel:max-w-3xl">
        <label htmlFor="rdx-chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="rdx-chat-input"
          ref={inputRef}
          rows={1}
          value={value}
          maxLength={MAX_INPUT_CHARS}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent py-2 text-[13px] leading-5 text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-rdx-red text-white shadow-sm transition hover:bg-rdx-red-hover disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-neutral-400">
        Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
}
