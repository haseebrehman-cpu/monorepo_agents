"use client";

import { useQuery } from "@tanstack/react-query";
import { healthQuery } from "./queries";

export type HealthStatus = "connecting" | "online" | "offline";

export function useHealth(): HealthStatus {
  const { status } = useQuery(healthQuery());
  if (status === "pending") return "connecting";
  return status === "success" ? "online" : "offline";
}
