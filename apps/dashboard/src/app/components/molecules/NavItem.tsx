import { cn } from "@rdx/ui";
import type { ReactNode } from "react";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick: () => void;
}

export default function NavItem({
  icon,
  label,
  active = false,
  collapsed = false,
  onClick,
}: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center rounded-lg text-sm font-medium transition-colors cursor-pointer",
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-300 hover:bg-white/10 hover:text-white",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className={cn("truncate", collapsed && "sr-only")}>{label}</span>
    </button>
  );
}
