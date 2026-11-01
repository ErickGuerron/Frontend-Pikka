import { Outlet } from 'react-router'
import { CustomerNavbar } from './CustomerNavbar'

/**
 * Customer layout: top navbar for navigation with no sidebar,
 * giving full width to the customer portal experience.
 */
export function CustomerLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <CustomerNavbar />
      <main className="relative min-h-screen w-full overflow-x-hidden pt-24 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
