import { Copy, Eye, Trash2 } from "lucide-react";
import { GridActionsCellItem, type GridColDef } from "@rdx/ui";
import { TicketStatusBadge } from "./TicketStatusBadge";

export type Ticket = {
  id: string;
  orderId: string;
  courier: string;
  trackingNumber: string;
  issue: string;
  ticketDate: string;
  status: string;
  assignedTo: string;
  createdBy: string;
  modifiedBy: string;
  closedBy: string;
};

type TicketColumnOptions = {
  statuses: string[];
  onView: (ticketId: string) => void;
  onDelete: (ticket: Ticket) => void;
  canDelete: boolean;
};

export function getTicketColumns({
  statuses,
  onView,
  onDelete,
  canDelete,
}: TicketColumnOptions): GridColDef<Ticket>[] {
  return [
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
    { field: "orderId", headerName: "Order ID", width: 150, flex: 1 },
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
      valueOptions: statuses,
      renderCell: (params) => {
        const status = String(params.value ?? "");
        return <TicketStatusBadge status = { status } />;
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
          onClick={() => onView(params.row.id)}
          showInMenu
        />,
        ...(canDelete
          ? [
              <GridActionsCellItem
                key="delete"
                icon={<Trash2 className="h-4 w-4" />}
                label="Delete ticket"
                onClick={() => onDelete(params.row)}
                showInMenu
              />,
            ]
          : []),
        // <GridActionsCellItem
        //   key="history"
        //   icon={<History className="h-4 w-4" />}
        //   label="View history"
        //   showInMenu
        // />,
      ],
    },
  ];
}
