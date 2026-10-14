import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "@rdx/ui";

const meta = {
  title: "Components/Input",
  component: Input,
  args: {
    placeholder: "Enter text",
    disabled: false,
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "name@example.com",
  },
};

export const Number: Story = {
  args: {
    type: "number",
    placeholder: "0",
  },
};

export const Date: Story = {
  args: {
    type: "date",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Read only value",
  },
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "Invalid value",
  },
};
