import { Button } from "@rdx/ui";
import CTS from "../../../components/atoms/CTS";
import { columns, type Ticket } from "./tickets-table/columns";
import { DataTable } from "./tickets-table/data-table";
import { FileUpIcon, PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAuthUser } from "../../../lib/auth";
import { hasPermission, P } from "../../../lib/permissions";
import { useMe } from "../../../lib/use-me";

const TICKETS: Ticket[] = [
  {
    id: "CTS-1001",
    courier: "DHL",
    trackingNumber: "1234567890",
    issue: "Delayed",
    assignedTo: "Agent A",
    ticketDate: "2026-09-01",
    status: "Open",
    createdBy: "System",
    modifiedBy: "Agent A",
    closedBy: "Agent A",
  },
  {
    id: "CTS-1002",
    courier: "FedEx",
    trackingNumber: "1234567890",
    issue: "Lost",
    assignedTo: "Agent B",
    ticketDate: "2026-09-03",
    status: "In progress",
    createdBy: "Agent A",
    modifiedBy: "Agent B",
    closedBy: "Agent B",
  },
  {
    id: "CTS-1003",
    courier: "UPS",
    trackingNumber: "1234567890",
    issue: "Damaged",
    ticketDate: "2026-09-05",
    assignedTo: "Agent A",
    status: "Resolved",
    createdBy: "Agent B",
    modifiedBy: "System",
    closedBy: "System",
  },
  {
    id: "CTS-1004",
    courier: "Aramex",
    trackingNumber: "1234567890",
    issue: "Wrong address",
    ticketDate: "2026-09-08",
    assignedTo: "Unassigned",
    status: "Closed",
    createdBy: "System",
    modifiedBy: "System",
    closedBy: "System",
  },
  {
    id: "CTS-1005",
    courier: "DHL",
    trackingNumber: "1234567890",
    issue: "Lost",
    ticketDate: "2026-09-08",
    assignedTo: "Agent B",
    status: "Open",
    createdBy: "Agent A",
    modifiedBy: "Agent B",
    closedBy: "Agent B",
  },
  {
    id: "CTS-1006",
    courier: "FedEx",
    trackingNumber: "1234567890",
    issue: "Delayed",
    ticketDate: "2026-09-09",
    assignedTo: "Agent A",
    status: "In progress",
    createdBy: "System",
    modifiedBy: "Agent A",
    closedBy: "Agent A",
  },
  {
    id: "CTS-1007",
    courier: "UPS",
    trackingNumber: "1234567890",
    issue: "Wrong address",
    ticketDate: "2026-09-09",
    assignedTo: "Unassigned",
    status: "Resolved",
    createdBy: "Agent B",
    modifiedBy: "System",
    closedBy: "System",
  },
  {
    id: "CTS-1008",
    courier: "Aramex",
    trackingNumber: "1234567890",
    issue: "Damaged",
    ticketDate: "2026-09-10",
    assignedTo: "Agent A",
    status: "Closed",
    createdBy: "System",
    modifiedBy: "Agent A",
    closedBy: "Agent A",
  },
];

const Tickets = () => {
  const navigate = useNavigate();
  const me = useMe();
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
      <CTS />
      <DataTable columns={columns} data={TICKETS} />
    </div >
  );
};

export default Tickets;
