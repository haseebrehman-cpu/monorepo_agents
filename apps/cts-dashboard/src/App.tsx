import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom'
import Layout from './layout/Layout'
import { type ActiveNavId } from './Data/nav'

const NAV_PATHS: Partial<Record<ActiveNavId, string>> = {
  home: '/',
  tracking: '/tracking',
  refund_resend: '/refund-resend',
  invoices: '/invoices',
  prices: '/prices',
  courier_reports: '/reports',
  overall_details: '/overall-details',
  on_time_delivery_ratio: '/on-time-delivery-ratio',
  in_transit_details: '/in-transit-details',
  country_specific: '/country-specific',
  country_courier_specific: '/country-courier-specific',
  warehouse_pending: '/warehouse-pending',
  manual_performance: '/manual-performance',
  refund: '/refund',
  resend: '/resend',
  frequency: '/frequency',
}

const PATH_NAV: Record<string, ActiveNavId> = {
  '/': 'home',
  '/tracking': 'tracking',
  '/refund-resend': 'refund_resend',
  '/invoices': 'invoices',
  '/prices': 'prices',
  '/reports': 'courier_reports',
  '/overall-details': 'overall_details',
  '/on-time-delivery-ratio': 'on_time_delivery_ratio',
  '/in-transit-details': 'in_transit_details',
  '/country-specific': 'country_specific',
  '/country-courier-specific': 'country_courier_specific',
  '/warehouse-pending': 'warehouse_pending',
  '/manual-performance': 'manual_performance',
  '/refund': 'refund',
  '/resend': 'resend',
  '/frequency': 'frequency',
}

function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeId = PATH_NAV[location.pathname] ?? 'home'

  const onNavigate = (id: ActiveNavId) => {
    const path = NAV_PATHS[id]
    if (path) navigate(path)
  }

  return <Layout activeId={activeId} onNavigate={onNavigate} />
}

function App() {
  return (
    <Router basename='/cts-dashboard'>
      <AppShell />
    </Router>
  )
}

export default App
