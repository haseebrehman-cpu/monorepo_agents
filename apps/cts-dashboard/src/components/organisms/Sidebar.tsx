import NavItem from "../molecules/NavItem";
import { NAV_ITEMS, type ActiveNavId, type NavId } from "../../Data/nav";
import {
  BookIcon,
  Button,
  ChannelIcon,
  ChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  HomeIcon,
  IntegrationIcon,
  TeamIcon,
  cn,
} from "@rdx/ui";
import { useState, type ReactNode } from "react";

const NAV_ICONS: Record<NavId, ReactNode> = {
  home: <HomeIcon />,
  tracking: <IntegrationIcon />,
  refund_resend: <BookIcon />,
  courier_invoices: <ChannelIcon />,
  performance: <ChartIcon />,
  manual_performance: <TeamIcon />,
  reports: <CreditCardIcon />,
};

interface SidebarProps {
  activeId: ActiveNavId;
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: (id: ActiveNavId) => void;
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
  const [expandedIds, setExpandedIds] = useState<Partial<Record<NavId, boolean>>>(
    {},
  );

  const toggleExpanded = (id: NavId) => {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <aside
      id="dashboard-sidebar"
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-slate-300 transition-transform duration-200 md:static md:translate-x-0 md:transition-[width]",
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
          CTS
        </div>
        <div className={cn("min-w-0 flex-1", iconOnly && "hidden")}>
          <p className="truncate text-sm font-semibold text-white">CTS</p>
          <p className="truncate text-xs text-slate-400">Courier Dashboard</p>
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

      <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const children = "children" in item ? item.children : undefined;
          const childActive = children?.some((child) => child.id === activeId);
          const expanded = Boolean(expandedIds[item.id]);

          return (
            <NavItem
              key={item.id}
              icon={NAV_ICONS[item.id]}
              label={item.label}
              active={activeId === item.id || Boolean(childActive)}
              collapsed={iconOnly}
              expanded={expanded}
              items={children}
              activeChildId={childActive ? String(activeId) : undefined}
              onClick={() => {
                if (children) {
                  toggleExpanded(item.id);
                  return;
                }
                onNavigate(item.id);
              }}
              onChildClick={(id) => onNavigate(id as ActiveNavId)}
            />
          );
        })}
      </nav>
    </aside>
  );
}
