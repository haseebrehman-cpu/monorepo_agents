import { TicketAttachmentChip } from "./TicketAttachmentChip";
import { formatHistoryDate, htmlToText, sanitizeHtml } from "./helpers";
import type { TicketHistoryItem } from "../../../../lib/tickets-api";

function personLabel(name: string, department?: string | null) {
  return department ? `${name} (${department})` : name;
}

function HistoryMeta({ item }: { item: TicketHistoryItem }) {
  const author = personLabel(item.authorName, item.authorDepartment);
  const wroteOn = formatHistoryDate(item.createdAt);

  if (item.kind === "status") {
    return (
      <p className="text-sm text-slate-700">
        <span className="font-semibold">{author}</span>
        {" changed status from "}
        <span className="font-medium">{item.fromStatus ?? "unknown"}</span>
        {" to "}
        <span className="font-medium">{item.toStatus ?? "unknown"}</span>
        {" on "}
        <span className="text-slate-500">{wroteOn}</span>
      </p>
    );
  }

  const assignedTo = item.assignedToName ?? "Unassigned";
  const action = item.kind === "created" ? "created this ticket on" : "wrote on";

  return (
    <p className="text-sm text-slate-700">
      <span className="font-semibold">{author}</span>
      {` ${action} `}
      <span className="text-slate-500">{wroteOn}</span>
      <span className="text-slate-400"> · </span>
      <span>
        Assigned to: <span className="font-medium">{assignedTo}</span>
      </span>
    </p>
  );
}

export default function TicketHistory({ items }: { items: TicketHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
        No history yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">History</h2>
      </div>
      <ol className="divide-y divide-slate-100">
        {items.map((item) => {
          const body = htmlToText(item.bodyHtml);
          return (
            <li key={item.id} className="px-4 py-3">
              <HistoryMeta item={item} />
              {body ? (
                <div
                  className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700 [&_a]:text-blue-600 [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.bodyHtml) }}
                />
              ) : null}
              {item.kind !== "created" && item.attachments.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.attachments.map((attachment) => (
                    <TicketAttachmentChip key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
