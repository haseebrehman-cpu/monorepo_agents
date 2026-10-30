import type { ReactNode } from "react";
import { cn } from "@rdx/ui";
import { Inbox, RotateCcw, TriangleAlert, type LucideIcon } from "lucide-react";
import { subtleButtonClass } from "./ui-classes";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  height?: number;
  className?: string;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, height, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      style={height ? { minHeight: height } : undefined}
      className={cn("flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", className)}
    >
      <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-xs text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  height?: number;
}

export function ErrorState({ title, description, onRetry, height }: ErrorStateProps) {
  return (
    <div
      role="alert"
      style={height ? { minHeight: height } : undefined}
      className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center"
    >
      <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-xs text-sm text-muted-foreground">{description}</p> : null}
      {onRetry ? (
        <button type="button" onClick={onRetry} className={cn(subtleButtonClass, "mt-2")}>
          <RotateCcw className="size-3.5" aria-hidden />
          Try again
        </button>
      ) : null}
    </div>
  );
}
