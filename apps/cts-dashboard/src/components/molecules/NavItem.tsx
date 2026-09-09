import { ChevronRightIcon, cn } from "@rdx/ui";
import type { ReactNode } from "react";

interface NavChild {
  id: string;
  label: string;
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  expanded?: boolean;
  items?: readonly NavChild[];
  activeChildId?: string;
  onClick: () => void;
  onChildClick?: (id: string) => void;
}

export default function NavItem({
  icon,
  label,
  active = false,
  collapsed = false,
  expanded = false,
  items,
  activeChildId,
  onClick,
  onChildClick,
}: NavItemProps) {
  const hasItems = Boolean(items?.length);

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        title={collapsed ? label : undefined}
        aria-current={active && !hasItems ? "page" : undefined}
        aria-expanded={hasItems ? expanded : undefined}
        className={cn(
          "flex w-full items-center rounded-lg text-sm font-medium transition-colors cursor-pointer",
          collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
          active
            ? "bg-slate-800 text-white shadow-sm"
            : "text-slate-400 hover:bg-white/10 hover:text-white",
        )}
      >
        <span className="shrink-0">{icon}</span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            collapsed && "sr-only",
          )}
        >
          {label}
        </span>
        {hasItems && !collapsed ? (
          <ChevronRightIcon
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              expanded && "rotate-90",
            )}
          />
        ) : null}
      </button>

      {hasItems && expanded && !collapsed ? (
        <div
          className="mt-1 ml-4 space-y-1 border-l border-white/10 pl-2"
          role="group"
          aria-label={`${label} submenu`}
        >
          {items!.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onChildClick?.(child.id)}
              aria-current={activeChildId === child.id ? "page" : undefined}
              className={cn(
                "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                activeChildId === child.id
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/10 hover:text-white",
              )}
            >
              {child.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
