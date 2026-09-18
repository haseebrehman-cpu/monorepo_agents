import { useMemo, useState } from "react";
import { Button } from "@rdx/ui";
import { FileUpIcon, Loader, PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CTS from "../../../components/atoms/CTS";
import { getAuthUser } from "../../../lib/auth";
import { hasPermission, P } from "../../../lib/permissions";
import { EMPTY_TICKET_FILTERS } from "../../../lib/tickets-api";
import { useMe } from "../../../lib/use-me";
import { useTicketOptions, useTickets, useUpdateTicketStatus } from "../../../lib/use-tickets";
import { getTicketColumns } from "./tickets-table/columns";
import { DataTable } from "./tickets-table/data-table";

const Tickets = () => {
  const navigate = useNavigate();
  const me = useMe();
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_TICKET_FILTERS);
  const ticketsQuery = useTickets(appliedFilters);
  const optionsQuery = useTicketOptions();
  const updateStatus = useUpdateTicketStatus();
  const columns = useMemo(
    () =>
      getTicketColumns({
        statuses: optionsQuery.data?.statuses ?? [],
        onView: (ticketId) => navigate(`/tracking/${encodeURIComponent(ticketId)}`),
      }),
    [navigate, optionsQuery.data?.statuses]
  );
  const user = me.data?.user ?? getAuthUser();
  const canAdd = hasPermission(user, P.TRACKING_ADD);
  const canAddBulk = hasPermission(user, P.TRACKING_ADD_BULK);
  const ADD_TICKETS = "/add-tickets";
  const ADD_BULK_TICKETS = "/add-bulk-tickets";
  const handleAddTicket = () => {
    navigate(ADD_TICKETS);
  }
  const handleAddBulkTickets = () => {
    navigate(ADD_BULK_TICKETS);
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Ticket List</h1>
        <div className="flex flex-row gap-2">
          {canAdd ? (
            <Button size="sm" variant="outline" onClick={handleAddTicket}>
              <PlusIcon className="h-4 w-4" />
              Add Ticket
            </Button>
          ) : null}
          {canAddBulk ? (
            <Button size="sm" variant="outline" onClick={handleAddBulkTickets}>
              <FileUpIcon className="h-4 w-5" />
              Add Bulk Tickets
            </Button>
          ) : null}
        </div>
      </div>
      <CTS
        onApply={setAppliedFilters}
        onReset={() => setAppliedFilters(EMPTY_TICKET_FILTERS)}
      />
      {ticketsQuery.isLoading ? (
        <div className="flex flex-row items-center gap-2">
          <Loader className="h-4 w-4 animate-spin" />
          <p className="text-sm text-slate-500">Loading tickets...</p>
        </div>
      ) : ticketsQuery.isError ? (
        <div className="flex flex-row items-center gap-2">
          <Loader className="h-4 w-4 animate-spin" />
          <p className="text-sm text-red-600">Could not load tickets.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={ticketsQuery.data ?? []}
          processRowUpdate={async (updatedRow, originalRow) => {
            if (updatedRow.status !== originalRow.status) {
              await updateStatus.mutateAsync({
                ticketId: updatedRow.id,
                status: updatedRow.status,
              });
            }
            return updatedRow;
          }}
        />
      )}
    </div >
  );
};

export default Tickets;
