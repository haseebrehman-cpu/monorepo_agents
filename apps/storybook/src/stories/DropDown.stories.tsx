import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropDown } from "@rdx/ui";

const OPTIONS = ["Shopify", "Amazon", "eBay", "Website"];

const meta = {
  title: "Components/DropDown",
  component: DropDown,
  args: {
    options: OPTIONS,
    label: "Select Sale Channel",
    className: "w-64",
  },
} satisfies Meta<typeof DropDown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    value: "Amazon",
  },
};

export const ObjectOptions: Story = {
  args: {
    options: [
      { label: "United Kingdom", value: "gb" },
      { label: "United States", value: "us" },
      { label: "Canada", value: "ca" },
    ],
    label: "Select Country",
  },
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <DropDown
        className="w-64"
        options={OPTIONS}
        value={value}
        onChange={setValue}
        label="Select Sale Channel"
      />
    );
  },
};
