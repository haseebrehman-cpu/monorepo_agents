import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataGrid, type GridColDef } from "@rdx/ui";

type RefundRow = {
  id: string;
  orderId: string;
  channel: string;
  country: string;
  status: string;
};

const rows: RefundRow[] = [
  { id: "1", orderId: "IG-11007", channel: "Shopify", country: "UK", status: "Open" },
  { id: "2", orderId: "IG-11012", channel: "Amazon", country: "US", status: "Pending" },
  { id: "3", orderId: "IG-11018", channel: "Website", country: "CA", status: "Closed" },
  { id: "4", orderId: "IG-11021", channel: "eBay", country: "AU", status: "Open" },
];

const columns: GridColDef<RefundRow>[] = [
  { field: "orderId", headerName: "Order ID", flex: 1, minWidth: 120 },
  { field: "channel", headerName: "Channel", flex: 1, minWidth: 120 },
  { field: "country", headerName: "Country", width: 120 },
  { field: "status", headerName: "Status", width: 120 },
];

const meta = {
  title: "Components/DataGrid",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DataGrid
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      height={420}
      checkboxSelection={false}
      cellSelection={false}
    />
  ),
};
