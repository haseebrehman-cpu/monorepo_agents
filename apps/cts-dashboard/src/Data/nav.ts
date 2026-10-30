export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "live_chat", label: "Live Chat" },
  {
    id: "tracking",
    label: "Order Tracking",
  },
  { id: "refund", label: "Refund Management" },
  { id: "resend", label: "Resend Management" },
  { id: "return", label: "Return Management" },
  // { id: "courier_invoices", label: "Courier Invoices", children: [
  //   { id: "invoices", label: "Invoices" },
  //   { id: "prices", label: "Prices" },
  //   { id: "courier_reports", label: "Reports" },
  // ] },
  // { id: "performance", label: "Performance", children: [
  //   { id: "overall_details", label: "Overall Details" },
  //   { id: "on_time_delivery_ratio", label: "On Time Delivery Ratio" },
  //   { id: "in_transit_details", label: "In Transit Details" },
  //   { id: "country_specific", label: "Country Specific" },
  //   { id: "country_courier_specific", label: "Country Courier Specific" },
  //   { id: "warehouse_pending", label: "Warehouse Pending" },
  // ] },
  // { id: "manual_performance", label: "Manual Performance" },
  // { id: "reports", label: "Reports", children: [
  //   { id: "reports_refund", label: "Refund" },
  //   { id: "reports_resend", label: "Resend" },
  //   { id: "reports_return", label: "Return" },
  //   { id: "frequency", label: "Frequency" },
  // ] },
  { id: "dropdown_values", label: "Dropdown Values" },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]["id"];

type NavItemWithChildren = Extract<
  (typeof NAV_ITEMS)[number],
  { children: readonly { id: string }[] }
>;

export type NavChildId = [NavItemWithChildren] extends [never]
  ? never
  : NavItemWithChildren["children"][number]["id"];

export type ExtraPageId = "addTickets" | "addBulkTickets" | "access";

export type ActiveNavId = NavId | NavChildId | ExtraPageId;

const EXTRA_PAGE_LABELS: Record<ExtraPageId, string> = {
  addTickets: "Add Tickets",
  addBulkTickets: "Add Bulk Tickets",
  access: "Access control",
};

export function getNavLabel(id: string): string {
  if (id in EXTRA_PAGE_LABELS) {
    return EXTRA_PAGE_LABELS[id as ExtraPageId];
  }

  for (const item of NAV_ITEMS) {
    if (item.id === id) return item.label;
    // if ("children" in item) {
    //   const child = item.children.find((entry) => entry.id === id);
    //   if (child) return child.label;
    // }
  }
  return "Dashboard";
}
