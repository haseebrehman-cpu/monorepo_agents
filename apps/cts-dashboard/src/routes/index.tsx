import type { ComponentType } from "react";
import { Tickets, RefundResend, Reports, Prices, Invoices, OverallDetails, On_TimeDelivery_Ratio, In_Transit_Details, Counrty_Specific, Country_Courier_Specific, Warehouse_Pending, ManualPerformance, Frequency, Resend, Refund, AddBulkTickets, AddTickets, AccessControl, Return } from "../pages";
import Dashboard_Home from "../pages/dashboard/Dashboard_Home";
import { P } from "../lib/permissions";

type PrivateRoute = {
    path: string;
    component: ComponentType;
    permission?: string;
};

const privateRoutes: PrivateRoute[] = [
    { path: '/', component: Dashboard_Home },
    { path: '/tracking', component: Tickets, permission: P.TRACKING_ACCESS },
    { path: '/refund-resend', component: RefundResend, permission: P.REFUND_ACCESS },
    { path: '/invoices', component: Invoices, permission: P.COURIER_INVOICES_INVOICES },
    { path: '/prices', component: Prices, permission: P.COURIER_INVOICES_PRICES },
    { path: '/reports', component: Reports, permission: P.COURIER_INVOICES_REPORTS },
    { path: '/overall-details', component: OverallDetails, permission: P.PERFORMANCE_OVERALL },
    { path: '/on-time-delivery-ratio', component: On_TimeDelivery_Ratio, permission: P.PERFORMANCE_OTDR },
    { path: '/in-transit-details', component: In_Transit_Details, permission: P.PERFORMANCE_IN_TRANSIT },
    { path: '/country-specific', component: Counrty_Specific, permission: P.PERFORMANCE_COUNTRY },
    { path: '/country-courier-specific', component: Country_Courier_Specific, permission: P.PERFORMANCE_COUNTRY_COURIER },
    { path: '/warehouse-pending', component: Warehouse_Pending, permission: P.PERFORMANCE_WAREHOUSE },
    { path: '/manual-performance', component: ManualPerformance, permission: P.MANUAL_PERFORMANCE_ACCESS },
    { path: '/frequency', component: Frequency, permission: P.REPORTS_FREQUENCY },
    { path: '/refund', component: Refund, permission: P.REFUND_ACCESS },
    { path: '/resend', component: Resend, permission: P.RESEND_ACCESS },
    { path: '/return', component: Return, permission: P.RETURN_ACCESS },
    { path: '/add-tickets', component: AddTickets, permission: P.TRACKING_ADD },
    { path: '/add-bulk-tickets', component: AddBulkTickets, permission: P.TRACKING_ADD_BULK },
    { path: '/access', component: AccessControl },
];

export { privateRoutes };
