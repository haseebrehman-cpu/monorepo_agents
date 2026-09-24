import { cn } from "@rdx/ui";
import { activeFor, MAX_QUEUE_LIMIT, MIN_QUEUE_LIMIT, queuedFor } from "./assignment";
import type { LiveConversation, SupportMember } from "./types";

export default function TeamAnalytics({
  members,
  conversations,
  onLimit,
}: {
  members: SupportMember[];
  conversations: LiveConversation[];
  onLimit: (memberId: string, limit: number) => void;
}) {
  const waiting = conversations.filter((conversation) => conversation.status === "waiting");
  const active = conversations.filter((conversation) => conversation.status === "active");
  const closed = conversations.filter((conversation) => conversation.status === "resolved");
  const unassigned = waiting.filter((conversation) => !conversation.queuedForId).length;
  const accepting = members.filter((member) => member.accepting).length;

  return (
    <section aria-labelledby="live-chat-team-title" className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[#f4f6f8]">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <h2 id="live-chat-team-title" className="text-sm font-semibold text-slate-900">
          Customer support
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          New handoffs fill the open queue slots of people who are accepting chats. Taken chats stay with the person who took them.
        </p>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Incoming" value={waiting.length} hint={unassigned === 0 ? "All assigned" : `${unassigned} over capacity`} />
          <Stat label="Taken" value={active.length} hint="Visible to the owner" />
          <Stat label="Closed" value={closed.length} hint="Resolved chats" />
          <Stat label="Accepting" value={`${accepting}/${members.length}`} hint="Open to new handoffs" />
        </div>

        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-2 font-semibold">Person</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Queued</th>
                <th className="px-4 py-2 font-semibold">Taken</th>
                <th className="px-4 py-2 font-semibold">Queue limit</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const queued = queuedFor(conversations, member.id);
                const taken = activeFor(conversations, member.id);
                const full = member.accepting && queued >= member.limit;
                return (
                  <tr key={member.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.role === "admin" ? "Support admin" : "Agent"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                          !member.accepting
                            ? "bg-slate-100 text-slate-600 ring-slate-200"
                            : full
                              ? "bg-amber-50 text-amber-900 ring-amber-200"
                              : "bg-emerald-50 text-emerald-800 ring-emerald-200",
                        )}
                      >
                        {!member.accepting ? "Not accepting" : full ? "At limit" : "Open"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      {queued}
                      <span className="text-slate-400"> / {member.limit}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{taken}</td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`limit-${member.id}`}>
                        Queue limit for {member.name}
                      </label>
                      <input
                        id={`limit-${member.id}`}
                        type="number"
                        min={MIN_QUEUE_LIMIT}
                        max={MAX_QUEUE_LIMIT}
                        value={member.limit}
                        onChange={(event) => onLimit(member.id, Number(event.target.value))}
                        className="w-16 rounded-md border border-slate-200 px-2 py-1 text-right text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
