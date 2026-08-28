import ConversationsPage from "@/app/features/conversations/ConversationsPage";
import OverviewPage from "@/app/features/overview/OverviewPage";
import PlaceholderPage from "@/app/features/placeholder/PlaceholderPage";
import DashboardLayout from "@/app/layouts/DashboardLayout";
import { NAV_ITEMS, type NavId } from "@/app/lib/nav";
import { useState } from "react";

export default function App() {
  const [activeId, setActiveId] = useState<NavId>("overview");
  const activeLabel =
    NAV_ITEMS.find((item) => item.id === activeId)?.label ?? "Dashboard";

  return (
    <DashboardLayout activeId={activeId} onNavigate={setActiveId}>
      {activeId === "overview" ? (
        <OverviewPage />
      ) : activeId === "conversations" ? (
        <ConversationsPage />
      ) : (
        <PlaceholderPage title={activeLabel} />
      )}
    </DashboardLayout>
  );
}
