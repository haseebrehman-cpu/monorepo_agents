"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { LiveChatMessage, LiveChatStatusSnapshot } from "@rdx/chat-contract";
import { createId } from "@/lib/chat/format";
import { LiveChatApiError, readLiveChatStream, sendLiveChatMessage, setLiveChatTyping } from "./api";
import type { LiveChatSession } from "./session";
import type { SseMessage } from "./sse";
import { compareMessageIds, INITIAL_LIVE_CHAT_STATE, liveChatReducer } from "./state";

/** The first delay follows a clean close (the server ends streams every 30 minutes). */
const RECONNECT_DELAYS_MS = [500, 2_000, 5_000, 10_000, 20_000];

const isExpired = (error: unknown) =>
  error instanceof LiveChatApiError && (error.status === 401 || error.status === 404);

function parseData<T>(message: SseMessage): T | null {
  try {
    return JSON.parse(message.data) as T;
  } catch {
    return null;
  }
}

/** Streams one live chat and sends the customer's messages. Idle while `session` is null. */
export function useLiveChat(session: LiveChatSession | null) {
  const [state, dispatch] = useReducer(liveChatReducer, INITIAL_LIVE_CHAT_STATE);
  const token = session?.token ?? null;
  const [trackedToken, setTrackedToken] = useState(token);
  if (token !== trackedToken) {
    setTrackedToken(token);
    dispatch({ type: "reset" });
  }
  const lastIdRef = useRef<string | null>(null);
  const pendingRef = useRef(state.pending);
  const typingHide = useRef<number | null>(null);

  useEffect(() => {
    pendingRef.current = state.pending;
  }, [state.pending]);

  useEffect(() => {
    if (!token) return;
    lastIdRef.current = null;
    const controller = new AbortController();
    let wake: (() => void) | null = null;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(done, ms);
        function done() {
          clearTimeout(timer);
          wake = null;
          resolve();
        }
        wake = done;
      });
    const onOnline = () => wake?.();
    window.addEventListener("online", onOnline);

    const onMessage = (message: SseMessage) => {
      if (message.event === "message") {
        const data = parseData<LiveChatMessage>(message);
        if (!data) return;
        if (!lastIdRef.current || compareMessageIds(data.id, lastIdRef.current) > 0) {
          lastIdRef.current = data.id;
        }
        dispatch({ type: "message", message: data });
      } else if (message.event === "status") {
        const data = parseData<LiveChatStatusSnapshot>(message);
        if (data) dispatch({ type: "status", snapshot: data });
      } else if (message.event === "typing") {
        const data = parseData<{ typing?: boolean }>(message);
        if (typeof data?.typing !== "boolean") return;
        dispatch({ type: "typing", typing: data.typing });
        if (typingHide.current !== null) window.clearTimeout(typingHide.current);
        typingHide.current = data.typing
          ? window.setTimeout(() => dispatch({ type: "typing", typing: false }), 15_000)
          : null;
      }
    };

    void (async () => {
      let attempts = 0;
      while (!controller.signal.aborted) {
        try {
          await readLiveChatStream({
            token,
            lastEventId: lastIdRef.current,
            signal: controller.signal,
            onOpen: () => {
              attempts = 0;
              dispatch({ type: "connection", connection: "open" });
            },
            onMessage,
          });
        } catch (error) {
          if (controller.signal.aborted) return;
          if (isExpired(error)) {
            dispatch({ type: "expired" });
            return;
          }
        }
        if (controller.signal.aborted) return;
        dispatch({ type: "connection", connection: "reconnecting" });
        await sleep(RECONNECT_DELAYS_MS[Math.min(attempts, RECONNECT_DELAYS_MS.length - 1)]);
        attempts += 1;
      }
    })();

    return () => {
      controller.abort();
      wake?.();
      if (typingHide.current !== null) window.clearTimeout(typingHide.current);
      window.removeEventListener("online", onOnline);
    };
  }, [token]);

  const deliver = useCallback(
    async (clientId: string, body: string) => {
      if (!token) return;
      try {
        const message = await sendLiveChatMessage(token, { body, clientId });
        dispatch({ type: "message", message });
      } catch (error) {
        if (isExpired(error)) dispatch({ type: "expired" });
        else if (error instanceof LiveChatApiError && error.code === "CONVERSATION_CLOSED") {
          dispatch({ type: "closed" });
        }
        dispatch({ type: "pending_failed", clientId });
      }
    },
    [token],
  );

  const typingSent = useRef(false);
  const typingAt = useRef(0);
  const typingTimer = useRef<number | null>(null);
  const notifyTyping = useCallback(
    (active: boolean) => {
      if (!token) return;
      if (active) {
        const now = Date.now();
        if (!typingSent.current || now - typingAt.current > 10_000) {
          typingSent.current = true;
          typingAt.current = now;
          void setLiveChatTyping(token, true).catch(() => undefined);
        }
        if (typingTimer.current !== null) window.clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => {
          typingSent.current = false;
          typingTimer.current = null;
          void setLiveChatTyping(token, false).catch(() => undefined);
        }, 3_000);
        return;
      }
      if (!typingSent.current) return;
      typingSent.current = false;
      if (typingTimer.current !== null) window.clearTimeout(typingTimer.current);
      typingTimer.current = null;
      void setLiveChatTyping(token, false).catch(() => undefined);
    },
    [token],
  );

  const send = useCallback(
    (text: string) => {
      const body = text.trim();
      if (!body || !token) return;
      const clientId = createId("live");
      dispatch({ type: "pending", clientId, body, at: Date.now() });
      notifyTyping(false);
      void deliver(clientId, body);
    },
    [deliver, notifyTyping, token],
  );

  /** Resends with the same client id, so a send that did land is not stored twice. */
  const retry = useCallback(
    (clientId: string) => {
      const pending = pendingRef.current.find((item) => item.clientId === clientId);
      if (!pending) return;
      dispatch({ type: "pending_retry", clientId });
      void deliver(clientId, pending.body);
    },
    [deliver],
  );

  const ended = state.expired || state.status === "resolved";

  return { ...state, ended, send, retry, notifyTyping };
}

export type LiveChat = ReturnType<typeof useLiveChat>;
