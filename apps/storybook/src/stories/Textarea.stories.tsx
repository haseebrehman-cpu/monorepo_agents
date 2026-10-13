import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "@rdx/ui";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  args: {
    placeholder: "Write a comment...",
    disabled: false,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: "The parcel arrived damaged and the buyer wants a refund.",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "This field is disabled.",
  },
};
