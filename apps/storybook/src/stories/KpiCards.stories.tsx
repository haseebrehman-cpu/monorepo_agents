import type { Meta, StoryObj } from "@storybook/react-vite";
import { InboxIcon, KpiCards } from "@rdx/ui";

const meta = {
  title: "Components/KpiCards",
  component: KpiCards,
  parameters: { layout: "padded" },
  args: {
    title: "Open tickets",
    value: 24,
    icon: <InboxIcon className="h-4 w-4" />,
    descriptionText: "Tickets waiting for a first response",
  },
} satisfies Meta<typeof KpiCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Grid: Story = {
  render: () => (
    <div className="grid w-[720px] grid-cols-3 gap-4">
      <KpiCards
        title="Open"
        value={24}
        icon={<InboxIcon className="h-4 w-4" />}
        descriptionText="Awaiting response"
      />
      <KpiCards
        title="Refunds"
        value={8}
        icon={<InboxIcon className="h-4 w-4" />}
        descriptionText="Created this week"
      />
      <KpiCards
        title="Returns"
        value={11}
        icon={<InboxIcon className="h-4 w-4" />}
        descriptionText="In progress"
      />
    </div>
  ),
};
