import Image from "next/image";
import type { Ref } from "react";
import { CHATBOT_ICON_SRC } from "@/lib/chat/constants";
import { CloseIcon } from "./icons";

interface ChatLauncherProps {
  isOpen: boolean;
  panelId: string;
  onToggle: () => void;
  buttonRef: Ref<HTMLButtonElement>;
}

export default function ChatLauncher({ isOpen, panelId, onToggle, buttonRef }: ChatLauncherProps) {
  return (
    <div className="fixed right-5 bottom-5 z-50 flex items-center gap-3 text-left">
      {!isOpen && (
        <button
          type="button"
          onClick={onToggle}
          className="animate-rdx-rise hidden cursor-pointer rounded-2xl rounded-br-sm bg-white px-4 py-2.5 text-left text-sm shadow-xl ring-1 ring-black/5 sm:block"
        >
          <span className="block font-semibold text-neutral-900">Need a hand?</span>
          <span className="block text-xs text-neutral-500">Ask our gear assistant</span>
        </button>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className={`relative flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-rdx-red focus-visible:ring-offset-2 focus-visible:outline-none ${
          isOpen
            ? "h-14 w-14 bg-rdx-black text-white shadow-lg ring-2 ring-rdx-red hover:bg-neutral-800"
            : "animate-rdx-pulse h-20 w-20 bg-[#e7e7e9]"
        }`}
      >
        {isOpen ? (
          <CloseIcon className="h-6 w-6" />
        ) : (
          <Image
            src={CHATBOT_ICON_SRC}
            alt=""
            width={160}
            height={160}
            loading="eager"
            draggable={false}
            className="pointer-events-none h-full w-full rounded-full object-contain"
          />
        )}
      </button>
    </div>
  );
}
