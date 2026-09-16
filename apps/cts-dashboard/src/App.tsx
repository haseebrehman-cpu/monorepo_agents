import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom'
import Layout from './layout/Layout'
import { type ActiveNavId } from './Data/nav'
import Login from './pages/authentication/Login'
import { GuestOnly, RequireAuth, RoleHomeRedirect } from './routes/guards'

const NAV_PATHS: Partial<Record<ActiveNavId, string>> = {
  dashboard: '/',
  tracking: '/tracking',
  refund: '/refund',
  resend: '/resend',
  return: '/return',
  courier_invoices: '/invoices',
  prices: '/prices',
  reports: '/reports',
  overall_details: '/overall-details',
  on_time_delivery_ratio: '/on-time-delivery-ratio',
  in_transit_details: '/in-transit-details',
  country_specific: '/country-specific',
  country_courier_specific: '/country-courier-specific',
  warehouse_pending: '/warehouse-pending',
  manual_performance: '/manual-performance',
  frequency: '/frequency',
  addTickets: '/add-tickets',
  addBulkTickets: '/add-bulk-tickets',
  access: '/access',
}

const PATH_NAV: Record<string, ActiveNavId> = {
  '/': 'dashboard',
  '/tracking': 'tracking',
  '/refund': 'refund',
  '/resend': 'resend',
  '/return': 'return',
  '/invoices': 'invoices',
  '/prices': 'prices',
  '/reports': 'reports',
  '/overall-details': 'overall_details',
  '/on-time-delivery-ratio': 'on_time_delivery_ratio',
  '/in-transit-details': 'in_transit_details',
  '/country-specific': 'country_specific',
  '/country-courier-specific': 'country_courier_specific',
  '/warehouse-pending': 'warehouse_pending',
  '/manual-performance': 'manual_performance',
  '/frequency': 'frequency',
  '/add-tickets': 'addTickets',
  '/add-bulk-tickets': 'addBulkTickets',
  '/access': 'access',
}

function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeId = PATH_NAV[location.pathname] ?? 'dashboard'

  const onNavigate = (id: ActiveNavId) => {
    const path = NAV_PATHS[id]
    if (path) navigate(path)
  }

  return <Layout activeId={activeId} onNavigate={onNavigate} />
}

function AppRoutes() {
  const { pathname } = useLocation()

  if (pathname === '/login') {
    return (
      <GuestOnly>
        <Login />
      </GuestOnly>
    )
  }

  return (
    <RequireAuth>
      <RoleHomeRedirect>
        <AppShell />
      </RoleHomeRedirect>
    </RequireAuth>
  )
}

function App() {
  return (
    <Router basename='/cts-dashboard'>
      <AppRoutes />
    </Router>
  )
}

export default App
