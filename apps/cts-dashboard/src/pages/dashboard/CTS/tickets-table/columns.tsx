import { Copy, Eye, History } from "lucide-react";
import { GridActionsCellItem, type GridColDef } from "@rdx/ui";

export type Ticket = {
  id: string;
  courier: string;
  trackingNumber: string;
  issue: string;
  ticketDate: string;
  status: "Open" | "In progress" | "Resolved" | "Closed";
  assignedTo: string;
  createdBy: string;
  modifiedBy: string;
  closedBy: string;
};

const STATUS_CLASS: Record<Ticket["status"], string> = {
  Open: "bg-sky-100 text-sky-800",
  "In progress": "bg-amber-100 text-amber-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Closed: "bg-slate-100 text-slate-700",
};

export const columns: GridColDef<Ticket>[] = [
  {
    field: "ticketDate",
    headerName: "Ticket date",
    type: "date",
    width: 150,
    valueGetter: (value) =>
      typeof value === "string" ? new Date(value) : value,
  },
  {
    field: "id",
    headerName: "Ticket ID",
    width: 130,
  },
  {
    field: "courier",
    headerName: "Courier",
    flex: 1,
    minWidth: 120,
  },
  {
    field: "trackingNumber",
    headerName: "Tracking number",
    flex: 1,
    minWidth: 150,
  },
  {
    field: "issue",
    headerName: "Issue",
    flex: 1,
    minWidth: 140,
  },
  {
    field: "assignedTo",
    headerName: "Assigned to",
    flex: 1,
    minWidth: 140,
  },
  {
    field: "createdBy",
    headerName: "Created by",
    width: 130,
  },
  {
    field: "modifiedBy",
    headerName: "Modified by",
    width: 130,
  },
  {
    field: "closedBy",
    headerName: "Closed by",
    width: 130,
  },
  {
    field: "status",
    headerName: "Status",
    type: "singleSelect",
    width: 140,
    editable: true,
    valueOptions: ["Open", "In progress", "Resolved", "Closed"],
    renderCell: (params) => {
      const status = params.value as Ticket["status"];
      return (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status] ?? "bg-slate-100 text-slate-700"}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    field: "actions",
    type: "actions",
    headerName: "Actions",
    width: 90,
    getActions: (params) => [
      <GridActionsCellItem
        key="copy"
        icon={<Copy className="h-4 w-4" />}
        label="Copy ticket ID"
        onClick={() => {
          void navigator.clipboard.writeText(params.row.id);
        }}
        showInMenu
      />,
      <GridActionsCellItem
        key="view"
        icon={<Eye className="h-4 w-4" />}
        label="View ticket"
        showInMenu
      />,
      <GridActionsCellItem
        key="history"
        icon={<History className="h-4 w-4" />}
        label="View history"
        showInMenu
      />,
    ],
  },
];
