import type { Ref } from "react";
import { CloseIcon } from "@rdx/ui";
import { CHATBOT_ICON_SRC } from "./constants";

interface ChatLauncherProps {
  isOpen: boolean;
  panelId: string;
  onToggle: () => void;
  buttonRef: Ref<HTMLButtonElement>;
}

export default function ChatLauncher({
  isOpen,
  panelId,
  onToggle,
  buttonRef,
}: ChatLauncherProps) {
  return (
    <button
      ref={buttonRef}
      onClick={onToggle}
      aria-controls={panelId}
      aria-expanded={isOpen}
      aria-label="Toggle chat widget"
      className={
        isOpen
          ? "fixed right-4 bottom-4 z-50 flex h-24 w-24 items-center justify-center rounded-full bg-rdx-black text-white shadow-lg ring-2 ring-rdx-red transition hover:bg-neutral-900 focus-visible:ring-2 focus-visible:ring-rdx-red focus-visible:ring-offset-2 focus-visible:outline-none"
          : "rdx-launcher-pulse fixed right-4 bottom-4 z-50 h-24 w-24 rounded-full bg-[#e7e7e9] p-0 focus-visible:ring-2 focus-visible:ring-rdx-red focus-visible:ring-offset-2 focus-visible:outline-none"
      }
    >
      {isOpen ? (
        <CloseIcon className="h-8 w-8" />
      ) : (
        <img
          src={CHATBOT_ICON_SRC}
          alt=""
          width={192}
          height={192}
          decoding="sync"
          draggable={false}
          className="pointer-events-none h-full w-full rounded-full object-contain"
        />
      )}
    </button>
  );
}
