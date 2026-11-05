import { authedApi } from "./auth";
import type {
  ChatMessage,
  ComposerMode,
  LiveConversation,
  SupportMember,
} from "../pages/dashboard/LiveChat/types";

type ApiResponse<T> = { success: true; data: T };

type DeskMessageDto = ChatMessage;

type DeskConversationDto = Omit<LiveConversation, "queuedForId" | "ownerId" | "typing" | "messages"> & {
  queuedForId: number | null;
  ownerId: number | null;
  lastMessage: DeskMessageDto | null;
  messages?: DeskMessageDto[];
};

type DeskMemberDto = Omit<SupportMember, "id"> & { id: number };

type DeskMeDto = DeskMemberDto & { canReceiveChats: boolean };

export type DeskMe = SupportMember & { canReceiveChats: boolean };

export type DeskConversationList = {
  items: LiveConversation[];
  resolvedTotal: number;
};

export type DeskEvent = {
  ids: string[] | null;
  assignedToYou: string[];
  queued: string[];
  members: boolean;
  /** Messages for these chats arrive on the `message` event. Do not reload the thread. */
  live: boolean;
};

const BASE = "/api/live-chat";

const idOrNull = (id: number | null) => (id === null ? null : String(id));

function toConversation(dto: DeskConversationDto): LiveConversation {
  return {
    ...dto,
    queuedForId: idOrNull(dto.queuedForId),
    ownerId: idOrNull(dto.ownerId),
    typing: false,
    lastMessage: dto.lastMessage,
    messages: dto.messages ?? [],
    messagesLoaded: dto.messages !== undefined,
  };
}

function toMember(dto: DeskMemberDto): SupportMember {
  return { ...dto, id: String(dto.id) };
}

function conversationPath(id: string, action = "") {
  return `${BASE}/conversations/${encodeURIComponent(id)}${action}`;
}

function post<T>(path: string, body?: unknown) {
  return authedApi().request<ApiResponse<T>>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function patch<T>(path: string, body: unknown) {
  return authedApi().request<ApiResponse<T>>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getDeskMe(): Promise<DeskMe> {
  const { data } = await authedApi().request<ApiResponse<DeskMeDto>>(`${BASE}/me`);
  return { ...toMember(data), canReceiveChats: data.canReceiveChats };
}

export async function updateDeskMe(input: { accepting?: boolean; limit?: number }): Promise<DeskMe> {
  const { data } = await patch<DeskMeDto>(`${BASE}/me`, input);
  return { ...toMember(data), canReceiveChats: data.canReceiveChats };
}

export async function listDeskMembers(): Promise<SupportMember[]> {
  const { data } = await authedApi().request<ApiResponse<DeskMemberDto[]>>(`${BASE}/members`);
  return data.map(toMember);
}

export async function updateDeskMemberLimit(memberId: string, limit: number) {
  await patch<DeskMemberDto | null>(`${BASE}/members/${encodeURIComponent(memberId)}`, { limit });
}

export async function listDeskConversations(): Promise<DeskConversationList> {
  const { data } = await authedApi().request<
    ApiResponse<{ items: DeskConversationDto[]; resolvedTotal: number }>
  >(`${BASE}/conversations`);
  return { items: data.items.map(toConversation), resolvedTotal: data.resolvedTotal };
}

export async function getDeskConversation(id: string): Promise<LiveConversation> {
  const { data } = await authedApi().request<ApiResponse<DeskConversationDto>>(conversationPath(id));
  return toConversation(data);
}

export async function markDeskConversationRead(id: string) {
  await post<undefined>(conversationPath(id, "/read"));
}

export type DeskAction =
  | { type: "take"; id: string }
  | { type: "resolve"; id: string }
  | { type: "transfer"; id: string; memberId: string }
  | { type: "message"; id: string; kind: ComposerMode; body: string; localId: string; authorName: string };

export type DeskActionResult =
  | { type: "conversation"; conversation: LiveConversation | null }
  | { type: "message"; message: ChatMessage };

/** Returns the updated conversation, or the stored message when the action was a send. */
export async function runDeskAction(action: DeskAction): Promise<DeskActionResult> {
  if (action.type === "message") {
    const { data } = await post<DeskMessageDto>(conversationPath(action.id, "/messages"), {
      kind: action.kind,
      body: action.body,
    });
    return { type: "message", message: data };
  }
  const { data } =
    action.type === "transfer"
      ? await post<DeskConversationDto | null>(conversationPath(action.id, "/transfer"), {
          memberId: Number(action.memberId),
        })
      : await post<DeskConversationDto | null>(conversationPath(action.id, `/${action.type}`));
  return { type: "conversation", conversation: data ? toConversation(data) : null };
}

/** Fire-and-forget. The desk shows the draft locally and does not wait on this. */
export function setDeskTyping(id: string, typing: boolean) {
  void post<undefined>(conversationPath(id, "/typing"), { typing }).catch(() => undefined);
}

export function deskEventsUrl(baseUrl: string) {
  return `${baseUrl}${BASE}/events`;
}
