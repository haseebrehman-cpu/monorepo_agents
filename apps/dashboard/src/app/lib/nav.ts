export const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "integrations", label: "Integrations" },
  { id: "knowledge_base", label: "Knowledge Base" },
  { id: "ai_configuration", label: "AI Configuration" },
  { id: "channel_widget", label: "Channel Widget" },
  { id: "conversations", label: "Conversations" },
  { id: "analytics", label: "Analytics" },
  { id: "team", label: "Team" },
  { id: "settings", label: "Settings" },
  { id: "billing", label: "Billing" },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]["id"];
