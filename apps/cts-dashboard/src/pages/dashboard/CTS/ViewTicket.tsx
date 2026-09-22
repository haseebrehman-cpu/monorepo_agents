import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@rdx/ui";
import { Loader, MessageSquarePlus } from "lucide-react";
import GoBack from "../../../components/molecules/GoBack";
import { useTicket } from "../../../lib/use-tickets";
import { TicketStatusBadge } from "./tickets-table/TicketStatusBadge";
import AddReplyDialog from "./ticket-detail/AddReplyDialog";
import TicketHistory from "./ticket-detail/TicketHistory";
import { TicketAttachmentChip } from "./ticket-detail/TicketAttachmentChip";
import { formatTicketDate } from "./ticket-detail/helpers";
import { useMe } from "../../../lib/use-me";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-slate-900">{value || "—"}</p>
    </div>
  );
}

const ViewTicket = () => {
  const { ticketId } = useParams();
  const decodedId = ticketId ? decodeURIComponent(ticketId) : "";
  const ticketQuery = useTicket(decodedId || undefined);
  const meQuery = useMe();
  const userDepartment = meQuery.data?.user?.department?.name;
  const isUserInAssignedDepartment = ticketQuery.data?.assignedTo === userDepartment;

  console.log(ticketQuery.data);
  const ticketCompleted = ticketQuery.data?.status === "Completed";

  const [replyOpen, setReplyOpen] = useState(false);

  if (ticketQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader className="h-4 w-4 animate-spin" />
        Loading ticket...
      </div>
    );
  }

  if (ticketQuery.isError || !ticketQuery.data) {
    return (
      <div className="flex flex-col gap-3">
        <GoBack />
        <p className="text-sm text-red-600">Could not load this ticket.</p>
      </div>
    );
  }

  const ticket = ticketQuery.data;
  const attachments = ticket.attachments ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <GoBack />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                Ticket detail
              </h1>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {ticket.id}
              </span>
              <TicketStatusBadge status={ticket.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Created by {ticket.createdBy}
              {ticket.createdByDepartment ? ` (${ticket.createdByDepartment})` : ""} · Assigned to{" "}
              {ticket.assignedTo}
            </p>
          </div>
        </div>
        {isUserInAssignedDepartment ? (
          <Button size="sm" onClick={() => setReplyOpen(true)}>
            <MessageSquarePlus className="h-4 w-6" />
            Add reply
          </Button>
        ) :
          null
        }
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailField label="Courier" value={ticket.courier} />
          <DetailField label="Tracking number" value={ticket.trackingNumber} />
          <DetailField label="Issue" value={ticket.issue} />
          <DetailField label="Query date" value={formatTicketDate(ticket.ticketDate)} />
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Attachments
          </p>
          {attachments.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <TicketAttachmentChip key={attachment.id} attachment={attachment} />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No attachments</p>
          )}
        </div>
      </section>

      <TicketHistory items={ticket.history ?? []} />

      <AddReplyDialog
        ticketId={ticket.id}
        assignedDepartmentId={ticket.assignedDepartmentId}
        open={replyOpen}
        onOpenChange={setReplyOpen}
        ticketCompleted={ticketCompleted}
      />
    </div>
  );
};

export default ViewTicket;
