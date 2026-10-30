import { cn } from "@rdx/ui/lib/utils";

export default function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white",
        className,
      )}
    />
  );
}
