import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookIcon,
  ChannelIcon,
  ChartIcon,
  ChatBubbleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CogIcon,
  CreditCardIcon,
  CrossCircleIcon,
  DashboardIcon,
  ExitFullScreenIcon,
  FullScreenIcon,
  HomeIcon,
  InboxIcon,
  IntegrationIcon,
  MenuIcon,
  PlusIcon,
  SendIcon,
  SettingsIcon,
  TeamIcon,
} from "@rdx/ui";

const ICONS = [
  ["CloseIcon", CloseIcon],
  ["ChatBubbleIcon", ChatBubbleIcon],
  ["PlusIcon", PlusIcon],
  ["CrossCircleIcon", CrossCircleIcon],
  ["FullScreenIcon", FullScreenIcon],
  ["ExitFullScreenIcon", ExitFullScreenIcon],
  ["SendIcon", SendIcon],
  ["HomeIcon", HomeIcon],
  ["InboxIcon", InboxIcon],
  ["BookIcon", BookIcon],
  ["CogIcon", CogIcon],
  ["MenuIcon", MenuIcon],
  ["ChevronLeftIcon", ChevronLeftIcon],
  ["ChevronRightIcon", ChevronRightIcon],
  ["IntegrationIcon", IntegrationIcon],
  ["ChannelIcon", ChannelIcon],
  ["ChartIcon", ChartIcon],
  ["DashboardIcon", DashboardIcon],
  ["TeamIcon", TeamIcon],
  ["CreditCardIcon", CreditCardIcon],
  ["SettingsIcon", SettingsIcon],
] as const;

const meta = {
  title: "Components/Icons",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <div className="grid w-[640px] grid-cols-3 gap-3 sm:grid-cols-4">
      {ICONS.map(([name, Icon]) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-slate-700"
        >
          <Icon className="h-6 w-6" />
          <span className="text-xs">{name}</span>
        </div>
      ))}
    </div>
  ),
};
