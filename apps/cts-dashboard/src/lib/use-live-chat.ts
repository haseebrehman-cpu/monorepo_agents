import { useEffect, useRef } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ApiError } from "@rdx/api-client";
import { CTS_API_BASE_URL } from "./api";
import {
  deskEventsUrl,
  getDeskConversation,
  getDeskMe,
  listDeskConversations,
  listDeskMembers,
  markDeskConversationRead,
  runDeskAction,
  updateDeskMe,
  updateDeskMemberLimit,
  type DeskAction,
  type DeskConversationList,
  type DeskEvent,
  type DeskMe,
} from "./live-chat-api";
import type { LiveConversation } from "../pages/dashboard/LiveChat/types";

export const liveChatKeys = {
  all: ["live-chat"] as const,
  me: ["live-chat", "me"] as const,
  members: ["live-chat", "members"] as const,
  conversations: ["live-chat", "conversations"] as const,
  conversation: (id: string) => ["live-chat", "conversation", id] as const,
};

const ERROR_MESSAGES: Record<string, string> = {
  CONVERSATION_NOT_FOUND: "That chat is no longer available to you.",
  CONVERSATION_CLOSED: "That chat is already closed.",
  NOT_QUEUED_FOR_YOU: "That chat is no longer assigned to you.",
  ALREADY_TAKEN: "Someone else already took that chat.",
  ALREADY_YOURS: "You already own that chat.",
  NOT_OWNER: "Only the person who owns this chat can do that.",
  INVALID_TRANSFER_TARGET: "Pick another support member to transfer to.",
  CUSTOMER_HAS_OPEN_CHAT: "This customer already has an open chat. Reply there instead.",
  MEMBER_NOT_FOUND: "That person can no longer take live chats.",
  FORBIDDEN: "You do not have permission to do that.",
  TOO_MANY_REQUESTS: "Too many actions. Wait a moment and try again.",
};

export function liveChatErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return ERROR_MESSAGES[error.message] ?? fallback;
  return fallback;
}

export function useDeskMe(enabled: boolean) {
  return useQuery({ queryKey: liveChatKeys.me, queryFn: getDeskMe, enabled, staleTime: 60_000 });
}

export function useDeskMembers(enabled: boolean) {
  return useQuery({ queryKey: liveChatKeys.members, queryFn: listDeskMembers, enabled, staleTime: 60_000 });
}

/** Kept fresh by the event stream. The slow poll covers a dropped stream. */
export function useDeskConversations(enabled: boolean) {
  return useQuery({
    queryKey: liveChatKeys.conversations,
    queryFn: listDeskConversations,
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

export type DeskTranscripts = {
  byId: Map<string, LiveConversation>;
  /** Open chats whose transcript has not arrived yet. */
  loadingIds: Set<string>;
  failedIds: Set<string>;
};

/** Full transcripts for the chats on screen. */
export function useDeskConversationDetails(ids: string[]): DeskTranscripts {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: liveChatKeys.conversation(id),
      queryFn: () => getDeskConversation(id),
      staleTime: 30_000,
      retry: false,
    })),
    combine: (results) => {
      const byId = new Map<string, LiveConversation>();
      const loadingIds = new Set<string>();
      const failedIds = new Set<string>();
      results.forEach((result, index) => {
        const id = ids[index];
        if (!id) return;
        if (result.data) byId.set(result.data.id, result.data);
        if (!result.data && result.isError && !result.isFetching) failedIds.add(id);
        else if (!result.data) loadingIds.add(id);
      });
      return { byId, loadingIds, failedIds };
    },
  });
}

function replaceRow(client: QueryClient, conversation: LiveConversation) {
  client.setQueryData<DeskConversationList>(liveChatKeys.conversations, (current) => {
    if (!current) return current;
    const row = { ...conversation, messages: [], messagesLoaded: false };
    const exists = current.items.some((item) => item.id === row.id);
    return {
      ...current,
      items: exists
        ? current.items.map((item) => (item.id === row.id ? row : item))
        : [...current.items, row],
    };
  });
}

export function useDeskAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: runDeskAction,
    onSuccess: (conversation, action) => {
      if (conversation) {
        client.setQueryData(liveChatKeys.conversation(conversation.id), conversation);
        replaceRow(client, conversation);
      } else {
        client.removeQueries({ queryKey: liveChatKeys.conversation(action.id) });
      }
      void client.invalidateQueries({ queryKey: liveChatKeys.conversations });
      if (action.type !== "message") void client.invalidateQueries({ queryKey: liveChatKeys.members });
    },
    onError: (error, action: DeskAction) => {
      toast.error(liveChatErrorMessage(error, "That did not work. Try again."));
      void client.invalidateQueries({ queryKey: liveChatKeys.conversations });
      void client.invalidateQueries({ queryKey: liveChatKeys.conversation(action.id) });
    },
  });
}

export function useUpdatePresence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateDeskMe,
    onMutate: (input) => {
      const previous = client.getQueryData<DeskMe>(liveChatKeys.me);
      if (previous) client.setQueryData<DeskMe>(liveChatKeys.me, { ...previous, ...input });
      return { previous };
    },
    onSuccess: (me) => client.setQueryData(liveChatKeys.me, me),
    onError: (error, _input, context) => {
      if (context?.previous) client.setQueryData(liveChatKeys.me, context.previous);
      toast.error(liveChatErrorMessage(error, "Could not update your status."));
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: liveChatKeys.members });
      void client.invalidateQueries({ queryKey: liveChatKeys.conversations });
    },
  });
}

export function useUpdateMemberLimit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, limit }: { memberId: string; limit: number }) =>
      updateDeskMemberLimit(memberId, limit),
    onError: (error) => toast.error(liveChatErrorMessage(error, "Could not change that limit.")),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: liveChatKeys.members });
      void client.invalidateQueries({ queryKey: liveChatKeys.me });
      void client.invalidateQueries({ queryKey: liveChatKeys.conversations });
    },
  });
}

export function useMarkRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: markDeskConversationRead,
    onMutate: (id) => {
      const clear = (conversation: LiveConversation) =>
        conversation.id === id ? { ...conversation, unread: 0 } : conversation;
      client.setQueryData<DeskConversationList>(liveChatKeys.conversations, (current) =>
        current ? { ...current, items: current.items.map(clear) } : current,
      );
      client.setQueryData<LiveConversation>(liveChatKeys.conversation(id), (current) =>
        current ? clear(current) : current,
      );
    },
  });
}

const RECONNECT_DELAYS_MS = [2_000, 5_000, 10_000, 30_000];

/**
 * One event stream per tab. Keeps desk queries fresh and calls `onEvent` so the
 * caller can raise notifications. The stream carries ids only.
 */
export function useLiveChatEvents(enabled: boolean, onEvent: (event: DeskEvent) => void) {
  const client = useQueryClient();
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!enabled) return;
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let stopped = false;
    let connectedBefore = false;

    const refreshAll = () => void client.invalidateQueries({ queryKey: liveChatKeys.all });

    const connect = () => {
      if (stopped) return;
      source = new EventSource(deskEventsUrl(CTS_API_BASE_URL), { withCredentials: true });
      source.onopen = () => {
        attempts = 0;
        if (connectedBefore) refreshAll();
        connectedBefore = true;
      };
      source.addEventListener("desk", (message) => {
        let event: DeskEvent;
        try {
          event = JSON.parse((message as MessageEvent<string>).data) as DeskEvent;
        } catch {
          return;
        }
        if (event.ids === null) {
          refreshAll();
        } else {
          void client.invalidateQueries({ queryKey: liveChatKeys.conversations });
          for (const id of event.ids) {
            void client.invalidateQueries({ queryKey: liveChatKeys.conversation(id) });
          }
          if (event.members) {
            void client.invalidateQueries({ queryKey: liveChatKeys.members });
            void client.invalidateQueries({ queryKey: liveChatKeys.me });
          }
        }
        onEventRef.current(event);
      });
      source.onerror = () => {
        if (!source || source.readyState !== EventSource.CLOSED) return;
        source.close();
        source = null;
        // A closed stream usually means the 15-minute session cookie expired.
        // Any authed request refreshes it, or sends the user to sign in.
        const delay = RECONNECT_DELAYS_MS[Math.min(attempts, RECONNECT_DELAYS_MS.length - 1)];
        attempts += 1;
        retryTimer = setTimeout(() => {
          void getDeskMe()
            .catch(() => undefined)
            .finally(connect);
        }, delay);
      };
    };

    connect();
    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
    };
  }, [enabled, client]);
}

export function fetchDeskConversation(client: QueryClient, id: string) {
  return client.fetchQuery({
    queryKey: liveChatKeys.conversation(id),
    queryFn: () => getDeskConversation(id),
    staleTime: 10_000,
  });
}
