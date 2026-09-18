const STATUS_CLASS: Record<string, string> = {
  Open: "bg-sky-100 text-sky-800",
  "In progress": "bg-amber-100 text-amber-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Closed: "bg-slate-100 text-slate-700",
};

export function TicketStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status}
    </span>
  );
}
