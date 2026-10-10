import { Outlet } from 'react-router'
import { Navbar } from './Navbar'
import { Topbar } from './Topbar'

export function AppLayout() {
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
