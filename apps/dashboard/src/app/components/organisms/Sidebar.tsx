import NavItem from "@/app/components/molecules/NavItem";
import { NAV_ITEMS, type NavId } from "@/app/lib/nav";
import {
  BookIcon,
  Button,
  ChannelIcon,
  ChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CogIcon,
  CreditCardIcon,
  HomeIcon,
  InboxIcon,
  IntegrationIcon,
  SettingsIcon,
  TeamIcon,
  cn,
} from "@rdx/ui";
import type { ReactNode } from "react";

const NAV_ICONS: Record<NavId, ReactNode> = {
  overview: <HomeIcon />,
  conversations: <InboxIcon />,
  integrations: <IntegrationIcon />,
  knowledge_base: <BookIcon />,
  ai_configuration: <CogIcon />,
  channel_widget: <ChannelIcon />,
  analytics: <ChartIcon />,
  team: <TeamIcon />,
  billing: <CreditCardIcon />,
  settings: <SettingsIcon />,
};

interface SidebarProps {
  activeId: NavId;
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: (id: NavId) => void;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  activeId,
  collapsed,
  mobileOpen,
  onNavigate,
  onToggleCollapse,
}: SidebarProps) {
  const iconOnly = collapsed && !mobileOpen;

  return (
    <aside
      id="dashboard-sidebar"
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform duration-200 md:static md:translate-x-0 md:transition-[width]",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:w-20" : "md:w-64",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-white/10",
          iconOnly ? "justify-center gap-1 px-1" : "gap-3 px-4",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          R
        </div>
        <div className={cn("min-w-0 flex-1", iconOnly && "hidden")}>
          <p className="truncate text-sm font-semibold text-white">RDX</p>
          <p className="truncate text-xs text-slate-400">Agent dashboard</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="hidden shrink-0 text-slate-400 hover:bg-white/10 hover:text-white md:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapse}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            icon={NAV_ICONS[item.id]}
            label={item.label}
            active={activeId === item.id}
            collapsed={iconOnly}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>
    </aside>
  );
}
