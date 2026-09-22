export const P = {
  TRACKING_ACCESS: "tracking.access",
  TRACKING_ADD: "tracking.add",
  TRACKING_ADD_BULK: "tracking.add_bulk",
  TRACKING_DELETE: "tracking.delete",
  REFUND_ACCESS: "refund_resend.access",
  RESEND_ACCESS: "refund_resend.resend_access",
  RETURN_ACCESS: "refund_resend.return_access",
  REFUND_CREATE: "refund_resend.create_refund",
  RETURN_CREATE: "refund_resend.create_return",
  RESEND_CREATE: "refund_resend.create_resend",
  COURIER_INVOICES_ACCESS: "courier_invoices.access",
  COURIER_INVOICES_INVOICES: "courier_invoices.invoices",
  COURIER_INVOICES_PRICES: "courier_invoices.prices",
  COURIER_INVOICES_REPORTS: "courier_invoices.reports",
  PERFORMANCE_ACCESS: "performance.access",
  PERFORMANCE_OVERALL: "performance.overall_details",
  PERFORMANCE_OTDR: "performance.on_time_delivery",
  PERFORMANCE_IN_TRANSIT: "performance.in_transit",
  PERFORMANCE_COUNTRY: "performance.country_specific",
  PERFORMANCE_COUNTRY_COURIER: "performance.country_courier",
  PERFORMANCE_WAREHOUSE: "performance.warehouse_pending",
  MANUAL_PERFORMANCE_ACCESS: "manual_performance.access",
  REPORTS_ACCESS: "reports.access",
  REPORTS_REFUND: "reports.refund",
  REPORTS_RESEND: "reports.resend",
  REPORTS_FREQUENCY: "reports.frequency",
} as const;

export type PermissionCode = (typeof P)[keyof typeof P];

export const ROLE = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "user",
  VIEWER: "viewer",
} as const;

export type AuthLike = {
  roles?: string[];
  permissions?: string[];
};

export function isSuperAdminUser(user?: AuthLike | null): boolean {
  return Boolean(user?.roles?.includes(ROLE.SUPER_ADMIN));
}

export function isAdminUser(user?: AuthLike | null): boolean {
  return Boolean(user?.roles?.includes(ROLE.ADMIN));
}

export function getHomePath(user?: AuthLike | null): string {
  return isSuperAdminUser(user) ? "/access" : "/";
}

export function hasPermission(user: AuthLike | null | undefined, code: string): boolean {
  if (!user) return false;
  if (isSuperAdminUser(user)) return false;
  if (isAdminUser(user)) return true;
  return Boolean(user.permissions?.includes(code));
}

const NAV_PERMISSION: Record<string, string> = {
  tracking: P.TRACKING_ACCESS,
  addTickets: P.TRACKING_ADD,
  addBulkTickets: P.TRACKING_ADD_BULK,
  refund: P.REFUND_ACCESS,
  resend: P.RESEND_ACCESS,
  return: P.RETURN_ACCESS,
  invoices: P.COURIER_INVOICES_INVOICES,
  prices: P.COURIER_INVOICES_PRICES,
  reports: P.COURIER_INVOICES_REPORTS,
  overall_details: P.PERFORMANCE_OVERALL,
  on_time_delivery_ratio: P.PERFORMANCE_OTDR,
  in_transit_details: P.PERFORMANCE_IN_TRANSIT,
  country_specific: P.PERFORMANCE_COUNTRY,
  country_courier_specific: P.PERFORMANCE_COUNTRY_COURIER,
  warehouse_pending: P.PERFORMANCE_WAREHOUSE,
  manual_performance: P.MANUAL_PERFORMANCE_ACCESS,
  frequency: P.REPORTS_FREQUENCY,
};

export function canAccessNav(user: AuthLike | null | undefined, navId: string): boolean {
  if (!user) return false;
  if (navId === "access") return isSuperAdminUser(user);
  if (isSuperAdminUser(user)) return false;
  if (navId === "home" || navId === "dashboard") return true;
  const code = NAV_PERMISSION[navId];
  if (!code) return true;
  return hasPermission(user, code);
}

type NavNode = {
  id: string;
  label: string;
  children?: readonly { id: string; label: string }[];
};

export function filterNavItems<T extends NavNode>(items: readonly T[], user: AuthLike | null | undefined): T[] {
  return items.flatMap((item) => {
    if (!item.children?.length) {
      return canAccessNav(user, item.id) ? [item] : [];
    }
    const children = item.children.filter((child) => canAccessNav(user, child.id));
    if (children.length === 0) return [];
    return [{ ...item, children }];
  });
}
