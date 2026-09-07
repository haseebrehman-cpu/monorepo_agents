import { Button, CrossCircleIcon, PlusIcon } from "@rdx/ui";
import { useHealthz } from "@/lib/use-healthz";
import { CHATBOT_ICON_SRC, STORE_NAME } from "./constants";

interface ChatHeaderProps {
  isTyping: boolean;
  onNewChat: () => void;
  onClose: () => void;
}

export default function ChatHeader({
  isTyping,
  onNewChat,
  onClose,
}: ChatHeaderProps) {
  const health = useHealthz();
  const isOnline = health.data?.status === "ok";

  return (
    <div className="relative flex items-center gap-3 bg-rdx-black px-4 py-3.5 text-white">
      <img
        src={CHATBOT_ICON_SRC}
        alt=""
        width={80}
        height={80}
        decoding="sync"
        draggable={false}
        className="h-11 w-11 shrink-0 rounded-full bg-[#e7e7e9] object-contain ring-1 ring-white/20"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold tracking-[0.14em] uppercase">
          {STORE_NAME}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-neutral-300">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-rdx-red" : "bg-neutral-500"}`}
            aria-hidden="true"
          />
          {isOnline
            ? "Online — gear advice, instantly"
            : health.isPending
              ? "Connecting…"
              : "API offline"}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:bg-white/10 hover:text-white"
        onClick={onNewChat}
        disabled={isTyping}
        aria-label="Start a new chat"
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:bg-white/10 hover:text-white"
        onClick={onClose}
        disabled={isTyping}
        aria-label="Close chat"
      >
        <CrossCircleIcon className="h-4 w-4" />
      </Button>
      <div
        className="absolute inset-x-0 bottom-0 h-0.5 bg-rdx-red"
        aria-hidden="true"
      />
    </div>
  );
}
