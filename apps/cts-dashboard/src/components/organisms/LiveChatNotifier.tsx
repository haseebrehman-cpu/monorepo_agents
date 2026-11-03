import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { hasPermission, isAdminUser, P } from "../../lib/permissions";
import { fetchDeskConversation, useLiveChatEvents } from "../../lib/use-live-chat";
import { useMe } from "../../lib/use-me";

function ChatToast({ title, body, onOpen }: { title: string; body: string; onOpen: () => void }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-600">{body}</p>
      <button
        type="button"
        onClick={onOpen}
        className="cursor-pointer rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Open chat
      </button>
    </div>
  );
}

/** Keeps the live-chat desk in sync and raises toasts for new chats on every page. */
export default function LiveChatNotifier() {
  const user = useMe().data?.user;
  const enabled = hasPermission(user, P.LIVE_CHAT_ACCESS);
  const isAdmin = isAdminUser(user);
  const client = useQueryClient();
  const navigate = useNavigate();

  useLiveChatEvents(enabled, (event) => {
    const notify = async (id: string, title: string, body: (name: string) => string) => {
      const conversation = await fetchDeskConversation(client, id).catch(() => null);
      if (!conversation) return;
      toast.info(
        ({ closeToast }) => (
          <ChatToast
            title={title}
            body={body(conversation.customerName)}
            onOpen={() => {
              closeToast();
              navigate(`/live-chat?chat=${encodeURIComponent(id)}`);
            }}
          />
        ),
        { toastId: `live-chat-${id}`, autoClose: 10_000 },
      );
    };

    for (const id of event.assignedToYou) {
      void notify(id, "New chat assigned to you", (name) => `${name} is waiting in your Active tab.`);
    }
    if (isAdmin) {
      for (const id of event.queued) {
        void notify(id, "New chat in User Queue", (name) => `${name} is waiting. Every agent is at their limit.`);
      }
    }
  });

  return null;
}
