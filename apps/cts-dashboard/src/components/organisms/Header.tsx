import UserChip from "../molecules/UserChip";
import { Button, MenuIcon } from "@rdx/ui";

interface HeaderProps {
  title: string;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

export default function Header({
  title,
  mobileOpen,
  onToggleMobile,
}: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <Button
        size="sm"
        variant="ghost"
        className="md:hidden"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileOpen}
        aria-controls="dashboard-sidebar"
        onClick={onToggleMobile}
      >
        <MenuIcon />
      </Button>
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900">
        {title}
      </h1>
      <UserChip />
    </header>
  );
}
