import type { GridColDef } from "@rdx/ui";
import { TicketStatusBadge } from "../../CTS/tickets-table/TicketStatusBadge";

export type RefundRow = {
  id: string;
  createdAt: string;
  orderId: string;
  category: string;
  lossNoLoss: string;
  type: string;
  saleChannel: string;
  country: string;
  accountable: string;
  reason: string;
  courier: string;
  productCategory: string;
  status: string;
};

export const refundColumns: GridColDef<RefundRow>[] = [
  {
    field: "createdAt",
    headerName: "Date",
    type: "date",
    width: 140,
    valueGetter: (value) =>
      typeof value === "string" && value ? new Date(value) : value,
  },
  { field: "id", headerName: "Refund ID", width: 130 },
  { field: "orderId", headerName: "Order ID", width: 140 },
  { field: "category", headerName: "Category", flex: 1, minWidth: 130 },
  { field: "lossNoLoss", headerName: "Loss/No Loss", width: 130 },
  { field: "type", headerName: "Type", width: 120 },
  { field: "saleChannel", headerName: "Sale Channel", flex: 1, minWidth: 140 },
  { field: "country", headerName: "Country", width: 120 },
  { field: "accountable", headerName: "Accountable", flex: 1, minWidth: 140 },
  { field: "reason", headerName: "Reason", flex: 1, minWidth: 160 },
  { field: "courier", headerName: "Courier", flex: 1, minWidth: 120 },
  {
    field: "productCategory",
    headerName: "Product Category",
    flex: 1,
    minWidth: 160,
  },
  {
    field: "status",
    headerName: "Status",
    width: 140,
    renderCell: (params) => (
      <TicketStatusBadge status={String(params.value ?? "")} />
    ),
  },
];
