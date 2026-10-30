import Image from "next/image";
import type { ReactNode } from "react";
import type { SupportStoreCode } from "@rdx/chat-contract";
import { useHealth } from "@/lib/api/use-health";
import { CHATBOT_ICON_SRC, STORE_NAME, storeOption } from "@/lib/chat/constants";
import { BagIcon, CloseIcon, CollapseIcon, ExpandIcon, PlusIcon } from "./icons";

interface ChatHeaderProps {
  store: SupportStoreCode;
  isTyping: boolean;
  expanded: boolean;
  cartOpen: boolean;
  cartCount: number;
  onToggleExpand: () => void;
  onToggleCart: () => void;
  onNewChat: () => void;
  onClose: () => void;
}

const STATUS_COPY = {
  online: { dot: "bg-emerald-400", text: "Online · replies instantly" },
  connecting: { dot: "bg-amber-400 animate-pulse", text: "Connecting…" },
  offline: { dot: "bg-rdx-red", text: "Offline" },
} as const;

function HeaderButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:bg-white/10 aria-pressed:text-white"
    >
      {children}
    </button>
  );
}

export default function ChatHeader({
  store,
  isTyping,
  expanded,
  cartOpen,
  cartCount,
  onToggleExpand,
  onToggleCart,
  onNewChat,
  onClose,
}: ChatHeaderProps) {
  const health = useHealth();
  const status = STATUS_COPY[health];
  const regionOption = storeOption(store);

  return (
    <header className="relative flex items-center gap-3 bg-rdx-black bg-[radial-gradient(circle_at_0%_0%,rgba(225,6,0,0.35),transparent_55%)] px-4 py-3 text-white">
      <div className="relative shrink-0">
        <Image
          src={CHATBOT_ICON_SRC}
          alt=""
          width={88}
          height={88}
          className="h-11 w-11 rounded-full bg-[#e7e7e9] object-contain ring-2 ring-white/15"
        />
        <span
          className={`absolute right-0 bottom-0 h-3 w-3 rounded-full ring-2 ring-rdx-black ${status.dot}`}
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2 font-display text-[15px] font-semibold tracking-[0.12em] uppercase">
          <span className="truncate">{STORE_NAME}</span>
          <span
            className="shrink-0 rounded-full bg-rdx-red/90 px-2 py-px font-sans text-[10px] font-semibold tracking-wide"
            title={regionOption.label}
          >
            {regionOption.shortLabel}
          </span>
        </p>
        <p className="truncate text-xs text-neutral-400">{status.text}</p>
      </div>
      <div className="flex items-center">
        <HeaderButton
          label={cartOpen ? "Back to chat" : "Open bag"}
          onClick={onToggleCart}
          pressed={cartOpen}
        >
          <BagIcon className="h-[18px] w-[18px]" />
          {cartCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rdx-red px-1 text-[9px] font-bold text-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </HeaderButton>
        <HeaderButton
          label={expanded ? "Exit full screen" : "Full screen"}
          onClick={onToggleExpand}
          pressed={expanded}
        >
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </HeaderButton>
        <HeaderButton label="Start a new chat" onClick={onNewChat} disabled={isTyping}>
          <PlusIcon className="h-[18px] w-[18px]" />
        </HeaderButton>
        <HeaderButton label="Close chat" onClick={onClose}>
          <CloseIcon className="h-[18px] w-[18px]" />
        </HeaderButton>
      </div>
      <span
        className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-rdx-red via-rdx-red to-transparent"
        aria-hidden="true"
      />
    </header>
  );
}
