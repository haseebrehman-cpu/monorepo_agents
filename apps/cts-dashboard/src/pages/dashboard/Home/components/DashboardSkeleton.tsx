import { cn } from "@rdx/ui";
import { Skeleton } from "./states";
import { cardClass } from "./ui-classes";

const BAR_HEIGHTS = [48, 72, 56, 84, 64, 92, 70, 58, 80, 66];

function ChartSkeleton({ className, height }: { className?: string; height: number }) {
  return (
    <div className={cn(cardClass, "p-5", className)}>
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-2 h-3 w-56" />
      <div className="mt-6 flex items-end gap-2" style={{ height }}>
        {BAR_HEIGHTS.map((barHeight, index) => (
          <div key={index} className="flex flex-1" style={{ height: `${barHeight}%` }}>
            <Skeleton className="w-full rounded-b-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Loading dashboard</span>
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="hidden h-4 w-64 sm:block" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={cn(cardClass, "p-5")}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1.5 h-3 w-40" />
              </div>
            </div>
            <Skeleton className="mt-5 h-8 w-28" />
            <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }, (_, row) => (
                <Skeleton key={row} className="h-3" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartSkeleton className="xl:col-span-2" height={260} />
        <ChartSkeleton height={260} />
      </div>
    </div>
  );
}
