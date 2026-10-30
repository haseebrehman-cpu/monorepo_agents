import { useEffect, useState } from "react";

/** Stands in for a network round trip until the dashboard is wired to real data. */
export function useSimulatedLoading(durationMs: number): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs]);

  return loading;
}
