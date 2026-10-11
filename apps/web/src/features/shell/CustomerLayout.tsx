import { useState } from 'react'
import { Outlet } from 'react-router'
import { CustomerSidebar } from './CustomerSidebar'
import { CustomerTopbar } from './CustomerTopbar'

/** Customer shell: fixed sidebar from lg up, slide-in drawer below it. */
export function CustomerLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface">
      <CustomerSidebar open={open} onClose={() => { setOpen(false) }} />
      <div className="min-h-screen lg:pl-64">
        <CustomerTopbar onMenu={() => { setOpen(true) }} />
        <main className="relative min-h-screen w-full overflow-x-hidden px-4 pt-16 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
