import { useMemo, useState } from "react";
import { Button } from "@rdx/ui";
import { FileUpIcon, Loader, PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CTS from "../../../components/atoms/TrackingFiltersPane";
import { hasPermission, P } from "../../../lib/permissions";
import {
  EMPTY_TICKET_FILTERS,
  type TicketSortField,
} from "../../../lib/tickets-api";
import { useMe } from "../../../lib/use-me";
import {
  useDeleteTicket,
  useTicketOptions,
  useTickets,
  useUpdateTicketStatus,
} from "../../../lib/use-tickets";
import { getTicketColumns, type Ticket } from "./tickets-table/columns";
import { DataTable } from "./tickets-table/data-table";
import DeleteTicketDialog from "./tickets-table/DeleteTicketDialog";

const Tickets = () => {
  const navigate = useNavigate();
  const me = useMe();
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_TICKET_FILTERS);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [sort, setSort] = useState<{
    sortBy: TicketSortField;
    sortDirection: "asc" | "desc";
  }>({
    sortBy: "ticketDate",
    sortDirection: "desc",
  });
  const ticketsQuery = useTickets(appliedFilters, {
    ...paginationModel,
    ...sort,
  });
  const optionsQuery = useTicketOptions();
  const updateStatus = useUpdateTicketStatus();
  const deleteTicket = useDeleteTicket();
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const user = me.data?.user;
  const canAdd = hasPermission(user, P.TRACKING_ADD);
  const canAddBulk = hasPermission(user, P.TRACKING_ADD_BULK);
  const canDelete = hasPermission(user, P.TRACKING_DELETE);
  const columns = useMemo(
    () =>
      getTicketColumns({
        statuses: optionsQuery.data?.statuses ?? [],
        onView: (ticketId) => navigate(`/tracking/${encodeURIComponent(ticketId)}`),
        onDelete: setTicketToDelete,
        canDelete,
      }),
    [canDelete, navigate, optionsQuery.data?.statuses]
  );
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
        onApply={(filters) => {
          setAppliedFilters(filters);
          setPaginationModel((current) => ({ ...current, page: 0 }));
        }}
        onReset={() => {
          setAppliedFilters(EMPTY_TICKET_FILTERS);
          setPaginationModel((current) => ({ ...current, page: 0 }));
        }}
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
          data={ticketsQuery.data?.items ?? []}
          loading={ticketsQuery.isFetching}
          rowCount={ticketsQuery.data?.total ?? 0}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={[{ field: sort.sortBy, sort: sort.sortDirection }]}
          onSortModelChange={(model) => {
            const next = model[0];
            setSort({
              sortBy: (next?.field as TicketSortField | undefined) ?? "ticketDate",
              sortDirection: next?.sort === "asc" ? "asc" : "desc",
            });
            setPaginationModel((current) => ({ ...current, page: 0 }));
          }}
          isCellEditable={(params) =>
            params.field !== "status" || params.row.status !== "Completed"
          }
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
      <DeleteTicketDialog
        ticket={ticketToDelete}
        open={ticketToDelete !== null}
        isDeleting={deleteTicket.isPending}
        onOpenChange={(open) => {
          if (!open && !deleteTicket.isPending) setTicketToDelete(null);
        }}
        onConfirm={() => {
          if (!ticketToDelete) return;
          deleteTicket.mutate(ticketToDelete.id, {
            onSuccess: () => setTicketToDelete(null),
          });
        }}
      />
    </div >
  );
};

export default Tickets;
