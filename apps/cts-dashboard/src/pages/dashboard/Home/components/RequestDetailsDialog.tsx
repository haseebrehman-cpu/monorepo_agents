import { cn, Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@rdx/ui";
import { ArrowUpRight, X } from "lucide-react";
import { MODULES, STATUSES } from "../constants";
import { formatCurrency, formatDateTime } from "../lib/format";
import { stageLabel } from "../lib/selectors";
import type { RequestRecord } from "../types";
import { RequestTypeBadge, StatusBadge } from "./StatusBadge";
import { iconButtonClass, subtleButtonClass } from "./ui-classes";

interface RequestDetailsDialogProps {
  /** Kept after closing so the content stays rendered during the exit animation. */
  record: RequestRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenModule: (route: string) => void;
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 truncate text-sm font-medium text-foreground", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  );
}

export function RequestDetailsDialog({ record, open, onOpenChange, onOpenModule }: RequestDetailsDialogProps) {
  return (
    <Dialog open={open && record !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto bg-card p-0 text-card-foreground ring-border">
        {record ? (
          <>
            <header className="flex items-start gap-3 border-b border-border p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="font-mono text-base text-foreground">{record.id}</DialogTitle>
                  <StatusBadge status={record.status} type={record.type} />
                </div>
                <DialogDescription className="mt-1 text-muted-foreground">
                  {MODULES[record.type].label} for order <span className="font-mono">{record.orderId}</span> · {record.reason}
                </DialogDescription>
              </div>
              <DialogClose className={iconButtonClass} aria-label="Close details">
                <X className="size-4" aria-hidden />
              </DialogClose>
            </header>

            <div className="grid gap-6 p-5 md:grid-cols-[1fr_15rem]">
              <dl className="grid grid-cols-2 content-start gap-x-4 gap-y-4">
                <Detail label="Customer" value={record.customerName} />
                <Detail label="Email" value={record.customerEmail} />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Request type</dt>
                  <dd className="mt-1">
                    <RequestTypeBadge type={record.type} />
                  </dd>
                </div>
                <Detail label="Order ID" value={record.orderId} mono />
                <Detail label="Sales channel" value={record.channel} />
                <Detail label="Destination" value={record.country} />
                <Detail label="Courier" value={record.courier} />
                <Detail label="Assigned to" value={record.assignee} />
                {record.amount !== null ? (
                  <Detail
                    label={record.type === "refund" ? "Refund amount" : "Item value"}
                    value={formatCurrency(record.amount, record.currency)}
                  />
                ) : null}
                <Detail label="Created" value={formatDateTime(record.createdAt)} />
                <Detail label="Last updated" value={formatDateTime(record.updatedAt)} />
              </dl>

              <section aria-label="Request history">
                <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">History</h3>
                <ol className="relative space-y-4 border-l border-border pl-5">
                  {[...record.history].reverse().map((event) => {
                    const Icon = STATUSES[event.status].icon;
                    return (
                      <li key={`${event.status}-${event.at.getTime()}`} className="relative">
                        <span className="absolute top-0 -left-[1.95rem] flex size-6 items-center justify-center rounded-full bg-card ring-1 ring-border">
                          <Icon className={cn("size-3.5", STATUSES[event.status].classes.icon)} aria-hidden />
                        </span>
                        <p className="text-sm font-medium text-foreground">{stageLabel(record.type, event.status)}</p>
                        <p className="text-xs text-muted-foreground">{event.note}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {formatDateTime(event.at)} · {event.actor}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            </div>

            <footer className="flex justify-end gap-2 border-t border-border p-4">
              <DialogClose className={subtleButtonClass}>Close</DialogClose>
              <button
                type="button"
                className={cn(subtleButtonClass, "border-transparent bg-foreground text-background hover:bg-foreground/90")}
                onClick={() => onOpenModule(MODULES[record.type].route)}
              >
                Open in {MODULES[record.type].shortLabel}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </button>
            </footer>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
