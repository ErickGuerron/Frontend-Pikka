import { Outlet } from 'react-router'
import { useCurrentUser } from '@/features/auth/hooks'
import { canAccess } from '@/features/auth/permissions'
import { CustomerLayout } from './CustomerLayout'
import { Navbar } from './Navbar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { data: user, isPending } = useCurrentUser()
  // Avoid flashing the staff shell at a customer while the profile loads.
  if (isPending) return <p className="muted p-4">Cargando…</p>
  if (canAccess(user?.role, 'myOrders')) return <CustomerLayout />

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pl-64 bg-surface min-h-screen">
        <Topbar />
        <main className="relative pt-16 w-full bg-surface min-h-screen overflow-x-hidden px-4 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
