"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupportStoreCode } from "@rdx/chat-contract";
import { PANEL_ID } from "@/lib/chat/constants";
import ChatLauncher from "./ChatLauncher";
import ChatPanel from "./ChatPanel";

export default function ChatWidget({ store }: { store: SupportStoreCode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [shownStore, setShownStore] = useState(store);
  const launcherRef = useRef<HTMLButtonElement>(null);

  if (shownStore !== store) {
    setShownStore(store);
    setIsOpen(true);
  }

  const close = useCallback(() => {
    setIsOpen(false);
    setExpanded(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (expanded) setExpanded(false);
      else close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, expanded, isOpen]);

  return (
    <>
      {isOpen && (
        <ChatPanel
          key={store}
          id={PANEL_ID}
          store={store}
          expanded={expanded}
          onToggleExpand={() => setExpanded((value) => !value)}
          onClose={close}
        />
      )}
      {!expanded && (
        <ChatLauncher
          isOpen={isOpen}
          panelId={PANEL_ID}
          onToggle={() => (isOpen ? close() : setIsOpen(true))}
          buttonRef={launcherRef}
        />
      )}
    </>
  );
}
