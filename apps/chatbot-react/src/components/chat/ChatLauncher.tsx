import type { Ref } from "react";
import { ChatBubbleIcon, CloseIcon } from "@rdx/ui";

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
      className="fixed right-4 bottom-4 z-50 rounded-full bg-indigo-600 p-3 text-white shadow-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
    >
      {isOpen ? <CloseIcon /> : <ChatBubbleIcon />}
    </button>
  );
}
