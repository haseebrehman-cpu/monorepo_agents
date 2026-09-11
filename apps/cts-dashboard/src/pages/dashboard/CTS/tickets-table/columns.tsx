import { createColumnHelper } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rdx/ui";
import { type DataTableFeatures } from "./data-table-features";

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

const columnHelper = createColumnHelper<DataTableFeatures, Ticket>();

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={
          table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor('ticketDate', {
    header: "Ticket date",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("ticketDate")}</span>
    ),
  }),
  columnHelper.accessor("id", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Ticket ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("id")}</span>
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("courier", {
    header: "Courier",
  }),
  columnHelper.accessor("trackingNumber", {
    header: "Tracking number",
  }),
  columnHelper.accessor("issue", {
    header: "Issue",
  }),
  columnHelper.accessor("assignedTo", {
    header: "Assigned to",
  }),
 
 
  columnHelper.accessor("createdBy", {
    header: "Created by",
  }),
  columnHelper.accessor("modifiedBy", {
    header: "Modified by",
  }),
  columnHelper.accessor("closedBy", {
    header: "Closed by",
  }),
  columnHelper.accessor("status", {
    header: "Status",
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const ticket = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(ticket.id)}
              >
                Copy ticket ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View ticket</DropdownMenuItem>
              <DropdownMenuItem>View history</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
