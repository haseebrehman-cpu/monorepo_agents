"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { makeQueryClient } from "@/lib/api/query-client";
import { setLiveChatApiBase } from "@/lib/live-chat/base";

export default function Providers({
  children,
  liveChatApiBase = "",
}: {
  children: ReactNode;
  liveChatApiBase?: string;
}) {
  // Parent render runs before the chat panel, so a handoff on the first reply can see this.
  setLiveChatApiBase(liveChatApiBase);
  const [queryClient] = useState(makeQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
