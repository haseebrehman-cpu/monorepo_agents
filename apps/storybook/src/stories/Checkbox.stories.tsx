import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "@rdx/ui";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: { checked: false },
};

export const Checked: Story = {
  args: { checked: true },
};

export const Indeterminate: Story = {
  args: { checked: true, indeterminate: true },
};

export const Disabled: Story = {
  args: { checked: true, disabled: true },
};

export const WithLabel: Story = {
  render: function WithLabelStory() {
    const [checked, setChecked] = useState(false);
    return (
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <Checkbox checked={checked} onCheckedChange={setChecked} />
        Issue with Listing
      </label>
    );
  },
};
