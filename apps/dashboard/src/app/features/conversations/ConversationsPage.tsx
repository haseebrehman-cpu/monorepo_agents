import type { ChatMessage } from "@rdx/chat-contract";

const conversations: ChatMessage[] = [];

export default function ConversationsPage() {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div>
        <p className="text-sm font-medium text-slate-600">Conversations</p>
        <p className="mt-1 text-sm text-slate-400">
          {conversations.length === 0
            ? "No conversations yet."
            : `${conversations.length} conversations`}
        </p>
      </div>
    </div>
  );
}
