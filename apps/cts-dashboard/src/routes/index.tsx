import { Login, Tickets, RefundResend, Reports, Prices, Invoices, OverallDetails, On_TimeDelivery_Ratio, In_Transit_Details, Counrty_Specific, Country_Courier_Specific, Warehouse_Pending, ManualPerformance, Frequency, Resend, Refund } from "../pages";
import Dashboard_Home from "../pages/dashboard/Dashboard_Home";

const publicRoutes = [
    { path: 'login', component: Login },
]

const privateRoutes = [
    { path: '/', component: Dashboard_Home },
    { path: '/tracking', component: Tickets },
    { path: '/refund-resend', component: RefundResend },
    { path: '/invoices', component: Invoices },
    { path: '/prices', component: Prices },
    { path: '/reports', component: Reports },
    { path: '/overall-details', component: OverallDetails },
    { path: '/on-time-delivery-ratio', component: On_TimeDelivery_Ratio },
    { path: '/in-transit-details', component: In_Transit_Details },
    { path: '/country-specific', component: Counrty_Specific },
    { path: '/country-courier-specific', component: Country_Courier_Specific },
    { path: '/warehouse-pending', component: Warehouse_Pending },
    { path: '/manual-performance', component: ManualPerformance },
    { path: '/frequency', component: Frequency },
    { path: '/refund', component: Refund },
    { path: '/resend', component: Resend },
]

export { publicRoutes, privateRoutes }