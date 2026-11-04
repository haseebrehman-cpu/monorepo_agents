"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupportReply, SupportStoreCode } from "@rdx/chat-contract";
import { readJson, removeItem, writeJson } from "@/lib/chat/storage";
import { claimLiveChatToken } from "./api";
import { liveChatIsConfigured } from "./base";
import { liveChatHandoffFromReply as readHandoff, type LiveChatHandoff } from "./handoff";

export type { LiveChatHandoff };

export interface LiveChatSession {
  handoffId: string;
  reference: string;
  /** Null while the widget is exchanging the handoff id for a token. */
  token: string | null;
}

const sessionKey = (store: SupportStoreCode) => `rdx-chat:live:${store}`;

function storedSession(store: SupportStoreCode): LiveChatSession | null {
  const stored = readJson<LiveChatSession>("session", sessionKey(store));
  if (!stored?.handoffId || !stored.reference || !stored.token) return null;
  return stored;
}

/** Uses the widget's live-chat config. Tests call `liveChatHandoffFromReply` in `handoff.ts` directly. */
export function liveChatHandoffFromReply(reply: SupportReply): LiveChatSession | null {
  return readHandoff(reply, liveChatIsConfigured());
}

/** Kept in sessionStorage per store once a token exists, so a reload stays in the live chat. */
export function useLiveChatSession(store: SupportStoreCode) {
  const [session, setSession] = useState<LiveChatSession | null>(() => storedSession(store));
  const [joinError, setJoinError] = useState(false);
  const claimGen = useRef(0);
  const sessionRef = useRef<LiveChatSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const persist = useCallback(
    (next: LiveChatSession) => {
      if (next.token) writeJson("session", sessionKey(store), next);
      setSession(next);
    },
    [store],
  );

  const open = useCallback(
    (next: LiveChatSession) => {
      const generation = ++claimGen.current;
      setJoinError(false);
      if (next.token) {
        persist(next);
        return;
      }
      setSession(next);
      void claimLiveChatToken(next.handoffId).then(
        (token) => {
          if (claimGen.current !== generation) return;
          persist({ ...next, token });
        },
        () => {
          if (claimGen.current !== generation) return;
          setJoinError(true);
        },
      );
    },
    [persist],
  );

  const retry = useCallback(() => {
    const current = sessionRef.current;
    if (current) open({ ...current, token: null });
  }, [open]);

  const end = useCallback(() => {
    claimGen.current += 1;
    removeItem("session", sessionKey(store));
    setJoinError(false);
    setSession(null);
  }, [store]);

  return { session, joinError, open, retry, end };
}
