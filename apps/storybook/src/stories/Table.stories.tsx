import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@rdx/ui";

const meta = {
  title: "Components/Table",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Recent refund tickets</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>IG-11007</TableCell>
          <TableCell>Shopify</TableCell>
          <TableCell>United Kingdom</TableCell>
          <TableCell>Open</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>IG-11012</TableCell>
          <TableCell>Amazon</TableCell>
          <TableCell>United States</TableCell>
          <TableCell>Pending</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>IG-11018</TableCell>
          <TableCell>Website</TableCell>
          <TableCell>Canada</TableCell>
          <TableCell>Closed</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell>3 tickets</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};
