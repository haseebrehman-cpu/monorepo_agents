import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@rdx/ui";

const items = [
  { label: "Full", value: "full" },
  { label: "Partial", value: "partial" },
  { label: "Replacement", value: "replacement" },
];

const meta = {
  title: "Components/Select",
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select items={items}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="--Select Type--" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const Grouped: Story = {
  render: () => (
    <Select
      items={[
        { label: "DPD", value: "dpd" },
        { label: "DHL", value: "dhl" },
        { label: "Royal Mail", value: "royal-mail" },
      ]}
    >
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Courier Service" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Couriers</SelectLabel>
          <SelectItem value="dpd">DPD</SelectItem>
          <SelectItem value="dhl">DHL</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Postal</SelectLabel>
          <SelectItem value="royal-mail">Royal Mail</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
