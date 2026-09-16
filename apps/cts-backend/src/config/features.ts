export type FeatureKind = "access" | "action";

export type FeatureDef = {
  code: string;
  label: string;
  group: string;
  kind: FeatureKind;
  parentCode?: string;
  sortOrder: number;
};

export const DEPARTMENTS = [
  { code: "customer_support", name: "Customer Support" },
  { code: "compliance", name: "Compliance" },
  { code: "supply_chain", name: "Supply Chain Management" },
] as const;

export const P = {
  TRACKING_ACCESS: "tracking.access",
  TRACKING_ADD: "tracking.add",
  TRACKING_ADD_BULK: "tracking.add_bulk",

  REFUND_RESEND_ACCESS: "refund_resend.access",
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

export const FEATURES: FeatureDef[] = [
  {
    code: P.TRACKING_ACCESS,
    label: "Access Tracking",
    group: "Tracking",
    kind: "access",
    sortOrder: 10,
  },
  {
    code: P.TRACKING_ADD,
    label: "Add Tracking",
    group: "Tracking",
    kind: "action",
    parentCode: P.TRACKING_ACCESS,
    sortOrder: 11,
  },
  {
    code: P.TRACKING_ADD_BULK,
    label: "Add Bulk Tracking",
    group: "Tracking",
    kind: "action",
    parentCode: P.TRACKING_ACCESS,
    sortOrder: 12,
  },

  {
    code: P.REFUND_RESEND_ACCESS,
    label: "Access Refund & Resend",
    group: "Refund & Resend",
    kind: "access",
    sortOrder: 20,
  },
  {
    code: P.REFUND_CREATE,
    label: "Create Refund",
    group: "Refund & Resend",
    kind: "action",
    parentCode: P.REFUND_RESEND_ACCESS,
    sortOrder: 21,
  },
  {
    code: P.RETURN_CREATE,
    label: "Create Return",
    group: "Refund & Resend",
    kind: "action",
    parentCode: P.REFUND_RESEND_ACCESS,
    sortOrder: 22,
  },
  {
    code: P.RESEND_CREATE,
    label: "Create Resend",
    group: "Refund & Resend",
    kind: "action",
    parentCode: P.REFUND_RESEND_ACCESS,
    sortOrder: 23,
  },

  {
    code: P.COURIER_INVOICES_ACCESS,
    label: "Access Courier Invoices",
    group: "Courier Invoices",
    kind: "access",
    sortOrder: 30,
  },
  {
    code: P.COURIER_INVOICES_INVOICES,
    label: "Invoices",
    group: "Courier Invoices",
    kind: "access",
    parentCode: P.COURIER_INVOICES_ACCESS,
    sortOrder: 31,
  },
  {
    code: P.COURIER_INVOICES_PRICES,
    label: "Prices",
    group: "Courier Invoices",
    kind: "access",
    parentCode: P.COURIER_INVOICES_ACCESS,
    sortOrder: 32,
  },
  {
    code: P.COURIER_INVOICES_REPORTS,
    label: "Reports",
    group: "Courier Invoices",
    kind: "access",
    parentCode: P.COURIER_INVOICES_ACCESS,
    sortOrder: 33,
  },

  {
    code: P.PERFORMANCE_ACCESS,
    label: "Access Performance",
    group: "Performance",
    kind: "access",
    sortOrder: 40,
  },
  {
    code: P.PERFORMANCE_OVERALL,
    label: "Overall Details",
    group: "Performance",
    kind: "access",
    parentCode: P.PERFORMANCE_ACCESS,
    sortOrder: 41,
  },
  {
    code: P.PERFORMANCE_OTDR,
    label: "On Time Delivery Ratio",
    group: "Performance",
    kind: "access",
    parentCode: P.PERFORMANCE_ACCESS,
    sortOrder: 42,
  },
  {
    code: P.PERFORMANCE_IN_TRANSIT,
    label: "In Transit Details",
    group: "Performance",
    kind: "access",
    parentCode: P.PERFORMANCE_ACCESS,
    sortOrder: 43,
  },
  {
    code: P.PERFORMANCE_COUNTRY,
    label: "Country Specific",
    group: "Performance",
    kind: "access",
    parentCode: P.PERFORMANCE_ACCESS,
    sortOrder: 44,
  },
  {
    code: P.PERFORMANCE_COUNTRY_COURIER,
    label: "Country Courier Specific",
    group: "Performance",
    kind: "access",
    parentCode: P.PERFORMANCE_ACCESS,
    sortOrder: 45,
  },
  {
    code: P.PERFORMANCE_WAREHOUSE,
    label: "Warehouse Pending",
    group: "Performance",
    kind: "access",
    parentCode: P.PERFORMANCE_ACCESS,
    sortOrder: 46,
  },

  {
    code: P.MANUAL_PERFORMANCE_ACCESS,
    label: "Access Manual Performance",
    group: "Manual Performance",
    kind: "access",
    sortOrder: 50,
  },

  {
    code: P.REPORTS_ACCESS,
    label: "Access Reports",
    group: "Reports",
    kind: "access",
    sortOrder: 60,
  },
  {
    code: P.REPORTS_REFUND,
    label: "Refund",
    group: "Reports",
    kind: "access",
    parentCode: P.REPORTS_ACCESS,
    sortOrder: 61,
  },
  {
    code: P.REPORTS_RESEND,
    label: "Resend",
    group: "Reports",
    kind: "access",
    parentCode: P.REPORTS_ACCESS,
    sortOrder: 62,
  },
  {
    code: P.REPORTS_FREQUENCY,
    label: "Frequency",
    group: "Reports",
    kind: "access",
    parentCode: P.REPORTS_ACCESS,
    sortOrder: 63,
  },
];

export const FEATURE_CODES = FEATURES.map((feature) => feature.code);

export const FEATURE_BY_CODE = new Map(FEATURES.map((feature) => [feature.code, feature]));

export const ROLE = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "user",
  VIEWER: "viewer",
} as const;

export type RoleCode = (typeof ROLE)[keyof typeof ROLE];

export const ASSIGNABLE_ROLE_CODES = [ROLE.ADMIN, ROLE.USER, ROLE.VIEWER] as const;

export const DEFAULT_ROLES: {
  code: string;
  name: string;
  description: string;
}[] = [
  {
    code: ROLE.SUPER_ADMIN,
    name: "Super Admin",
    description: "Only Access Control. Creates admins and assigns feature access.",
  },
  {
    code: ROLE.ADMIN,
    name: "Admin",
    description: "Full access to every dashboard feature except Access Control",
  },
  {
    code: ROLE.USER,
    name: "User",
    description: "Can view assigned features and perform granted actions",
  },
  {
    code: ROLE.VIEWER,
    name: "Viewer",
    description: "Can only view the features assigned to them",
  },
];
