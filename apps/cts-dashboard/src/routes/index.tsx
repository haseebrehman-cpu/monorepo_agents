import { lazy, type ComponentType } from "react";
import { P } from "../lib/permissions";

const loadPage = (
  importer: () => Promise<{ default: ComponentType }>
): ComponentType => lazy(importer);

type PrivateRoute = {
    path: string;
    component: ComponentType;
    permission?: string;
};

const privateRoutes: PrivateRoute[] = [
    { path: '/', component: loadPage(() => import("../pages/dashboard/Dashboard_Home")) },
    { path: '/live-chat', component: loadPage(() => import("../pages/dashboard/LiveChat/LiveChat")), permission: P.LIVE_CHAT_ACCESS },
    { path: '/tracking', component: loadPage(() => import("../pages/dashboard/CTS/Tickets")), permission: P.TRACKING_ACCESS },
    { path: '/tracking/:ticketId', component: loadPage(() => import("../pages/dashboard/CTS/ViewTicket")), permission: P.TRACKING_ACCESS },
    { path: '/refund', component: loadPage(() => import("../pages/dashboard/Refund/Refund")), permission: P.REFUND_ACCESS },
    { path: '/resend', component: loadPage(() => import("../pages/dashboard/Resend/Resend")), permission: P.RESEND_ACCESS },
    { path: '/return', component: loadPage(() => import("../pages/dashboard/Return/Return")), permission: P.RETURN_ACCESS },
    { path: '/invoices', component: loadPage(() => import("../pages/dashboard/CourierInvoices/Invoices")), permission: P.COURIER_INVOICES_INVOICES },
    { path: '/prices', component: loadPage(() => import("../pages/dashboard/CourierInvoices/Prices")), permission: P.COURIER_INVOICES_PRICES },
    { path: '/reports', component: loadPage(() => import("../pages/dashboard/CourierInvoices/Reports")), permission: P.COURIER_INVOICES_REPORTS },
    { path: '/reports/refund', component: loadPage(() => import("../pages/dashboard/Reports/Refund")), permission: P.REPORTS_REFUND },
    { path: '/reports/resend', component: loadPage(() => import("../pages/dashboard/Reports/Resend")), permission: P.REPORTS_RESEND },
    { path: '/reports/return', component: loadPage(() => import("../pages/dashboard/Reports/Return")), permission: P.REPORTS_RETURN },
    { path: '/overall-details', component: loadPage(() => import("../pages/dashboard/Performance/OverallDetails")), permission: P.PERFORMANCE_OVERALL },
    { path: '/on-time-delivery-ratio', component: loadPage(() => import("../pages/dashboard/Performance/On_TimeDelivery_Ratio")), permission: P.PERFORMANCE_OTDR },
    { path: '/in-transit-details', component: loadPage(() => import("../pages/dashboard/Performance/In_Transit_Details")), permission: P.PERFORMANCE_IN_TRANSIT },
    { path: '/country-specific', component: loadPage(() => import("../pages/dashboard/Performance/Counrty_Specific")), permission: P.PERFORMANCE_COUNTRY },
    { path: '/country-courier-specific', component: loadPage(() => import("../pages/dashboard/Performance/Country_Courier_Specific")), permission: P.PERFORMANCE_COUNTRY_COURIER },
    { path: '/warehouse-pending', component: loadPage(() => import("../pages/dashboard/Performance/Warehouse_Pending")), permission: P.PERFORMANCE_WAREHOUSE },
    { path: '/manual-performance', component: loadPage(() => import("../pages/dashboard/Manual_Performance")), permission: P.MANUAL_PERFORMANCE_ACCESS },
    { path: '/frequency', component: loadPage(() => import("../pages/dashboard/Reports/Frequency")), permission: P.REPORTS_FREQUENCY },
    { path: '/add-tickets', component: loadPage(() => import("../pages/dashboard/CTS/AddTickets")), permission: P.TRACKING_ADD },
    { path: '/add-bulk-tickets', component: loadPage(() => import("../pages/dashboard/CTS/AddBulkTickets")), permission: P.TRACKING_ADD_BULK },
    { path: '/access', component: loadPage(() => import("../pages/dashboard/Access/AccessControl")) },
];

export { privateRoutes };
