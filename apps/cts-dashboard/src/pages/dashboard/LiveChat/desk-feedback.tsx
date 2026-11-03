import { Button, cn, type ButtonProps } from "@rdx/ui";
import { LoaderCircleIcon } from "lucide-react";
import type { DeskAction } from "../../../lib/live-chat-api";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export type TranscriptStatus = "loading" | "error" | "ready";

export type ChatActivity = {
  pending: DeskAction | null;
  actionsLocked: boolean;
  transcriptStatus: TranscriptStatus;
  onRetryTranscript: () => void;
};

export function ActionButton({
  pending = false,
  pendingLabel,
  spinnerClassName = "h-3.5 w-3.5",
  children,
  className,
  disabled,
  ...props
}: ButtonProps & {
  pending?: boolean;
  pendingLabel?: string;
  spinnerClassName?: string;
}) {
  return (
    <Button
      {...props}
      className={cn("gap-1.5", className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      {pending ? (
        <LoaderCircleIcon className={cn("animate-spin", spinnerClassName)} aria-hidden="true" />
      ) : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

export function TranscriptPlaceholder({
  status,
  customerName,
  onRetry,
  compact = false,
}: {
  status: Exclude<TranscriptStatus, "ready"> | "empty";
  customerName: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  if (status === "loading") {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center gap-2 text-slate-500",
          compact ? "min-h-16" : "min-h-40",
        )}
        role="status"
      >
        <LoaderCircleIcon className={cn("animate-spin", compact ? "h-4 w-4" : "h-5 w-5")} aria-hidden="true" />
        <p className={compact ? "text-[11px]" : "text-sm"}>Opening chat with {customerName}…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center gap-2 px-4 text-center",
          compact ? "min-h-16" : "min-h-40",
        )}
        role="alert"
      >
        <p className={compact ? "text-[11px] text-slate-700" : "text-sm text-slate-700"}>
          Could not load this chat.
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              "cursor-pointer rounded-md bg-indigo-600 font-semibold text-white hover:bg-indigo-700",
              compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-sm",
              focusRing,
            )}
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <p className={cn("text-center text-slate-500", compact ? "px-2 py-4 text-[11px]" : "px-4 py-8 text-sm")}>
      No messages yet.
    </p>
  );
}
