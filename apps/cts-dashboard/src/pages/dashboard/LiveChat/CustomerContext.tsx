import { useState } from "react";
import { cn } from "@rdx/ui";
import { CheckIcon, CopyIcon, GlobeIcon, MapPinIcon, XIcon } from "lucide-react";
import { StatusChip } from "./ConversationList";
import { avatarColor, formatMessageTime, formatQueueTime, initials } from "./format";
import type { LiveConversation } from "./types";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export default function CustomerContext({
  conversation,
  assigneeName,
  modal,
  onClose,
  onAnnounce,
}: {
  conversation: LiveConversation;
  assigneeName: string | null;
  modal: boolean;
  onClose: () => void;
  onAnnounce: (message: string) => void;
}) {
  const waited = formatQueueTime(conversation.handedOffAt);
  const handedOff =
    waited === "now"
      ? `Just now, ${formatMessageTime(conversation.handedOffAt)}`
      : `${formatQueueTime(conversation.handedOffAt)} ago, ${formatMessageTime(conversation.handedOffAt)}`;

  return (
    <aside
      id="live-chat-customer"
      role={modal ? "dialog" : "complementary"}
      aria-modal={modal ? true : undefined}
      aria-labelledby="live-chat-customer-title"
      className="flex h-full w-[min(100vw,20rem)] flex-col border-l border-slate-200 bg-white"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 id="live-chat-customer-title" className="text-sm font-semibold text-slate-900">
          Customer
        </h2>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-600 hover:bg-slate-100",
            focusRing,
          )}
          aria-label="Close customer details"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              avatarColor(conversation.customerName),
            )}
            aria-hidden="true"
          >
            {initials(conversation.customerName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{conversation.customerName}</p>
            <a
              href={`mailto:${conversation.customerEmail}`}
              className={cn("mt-0.5 block truncate text-sm text-indigo-700 underline-offset-2 hover:underline", focusRing)}
            >
              {conversation.customerEmail}
            </a>
            <div className="mt-2">
              <StatusChip status={conversation.status} />
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <Detail term="Channel" value={conversation.channel} />
          <Detail
            term="Order"
            value={conversation.orderNumber ?? "Not linked"}
            mono={Boolean(conversation.orderNumber)}
            copyValue={conversation.orderNumber}
            onAnnounce={onAnnounce}
          />
          <Detail term="Assigned to" value={assigneeName ?? "Unassigned"} />
          <Detail term="Queued" value={handedOff} />
          <Detail term="Visits" value={String(conversation.visits)} />
        </dl>

        <section aria-labelledby="live-chat-visit" className="space-y-2">
          <h3 id="live-chat-visit" className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Current visit
          </h3>
          <p className="flex items-start gap-2 text-sm text-slate-800">
            <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            {conversation.location}
          </p>
          <p className="flex items-start gap-2 text-sm text-slate-800">
            <GlobeIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block font-mono text-xs">{conversation.currentPage}</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {conversation.browser} · from {conversation.referrer}
              </span>
            </span>
          </p>
        </section>

        <section aria-labelledby="live-chat-handoff-reason">
          <h3 id="live-chat-handoff-reason" className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Handoff reason
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-800">{conversation.handoffReason}</p>
        </section>

        <section aria-labelledby="live-chat-ai-summary" className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <h3 id="live-chat-ai-summary" className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            AI summary
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-800">{conversation.aiSummary}</p>
        </section>
      </div>
    </aside>
  );
}

function Detail({
  term,
  value,
  mono = false,
  copyValue,
  onAnnounce,
}: {
  term: string;
  value: string;
  mono?: boolean;
  copyValue?: string | null;
  onAnnounce?: (message: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      onAnnounce?.(`${term} copied`);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      onAnnounce?.(`Could not copy ${term.toLowerCase()}`);
    }
  };

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{term}</dt>
        <dd className={mono ? "mt-0.5 font-mono text-sm text-slate-900" : "mt-0.5 text-sm text-slate-900"}>{value}</dd>
      </div>
      {copyValue ? (
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-white",
            focusRing,
          )}
          aria-label={copied ? `${term} copied` : `Copy ${term.toLowerCase()}`}
        >
          {copied ? <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" /> : <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      ) : null}
    </div>
  );
}
