import {
  Button,
  ChatBubbleIcon,
  CrossCircleIcon,
  FullScreenIcon,
  PlusIcon,
} from "@rdx/ui";
import { STORE_NAME } from "./constants";

interface ChatHeaderProps {
  isTyping: boolean;
  onNewChat: () => void;
  onClose: () => void;
  onFullScreen: () => void;
}

export default function ChatHeader({
  isTyping,
  onNewChat,
  onClose,
  onFullScreen,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 bg-indigo-600 px-4 py-3.5 text-white">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
        <ChatBubbleIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{STORE_NAME} Assistant</p>
        <p className="flex items-center gap-1.5 text-xs text-indigo-100">
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            aria-hidden="true"
          />
          Online — we typically reply instantly
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:bg-white/15"
        onClick={onNewChat}
        disabled={isTyping}
        aria-label="Start a new chat"
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:bg-white/15"
        onClick={onClose}
        disabled={isTyping}
        aria-label="Close chat"
      >
        <CrossCircleIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        className="text-white hover:bg-white/15"
        onClick={onFullScreen}
        disabled={isTyping}
        aria-label="Open chat in full screen"
      >
        <FullScreenIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
