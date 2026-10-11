import { NavLink } from 'react-router'
import { useCurrentUser, useLogout } from '@/features/auth/hooks'
import { initialOf } from './initial'
import { canAccess, customerHomePath, sectionLabels, type Section } from '@/features/auth/permissions'

const navItems: { section: Section; to: string; icon: string }[] = [
  { section: 'myOrders', to: customerHomePath, icon: 'package_2' },
]

interface CustomerSidebarProps {
  open: boolean
  onClose: () => void
}

/** Dark teal sidebar for customers; becomes an off-canvas drawer below lg. */
export function CustomerSidebar({ open, onClose }: CustomerSidebarProps) {
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  return (
    <>
      {open ? <div aria-hidden="true" className="fixed inset-0 z-40 bg-on-background/50 lg:hidden" onClick={onClose} /> : null}
      <aside
        aria-label="Menú de cliente"
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col justify-between bg-inverse-surface shadow-xl transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="text-2xl font-bold lowercase tracking-tight text-white">pikka</span>
            <span className="rounded-full bg-primary-container/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-fixed">
              Cliente
            </span>
          </div>

          <div className="mx-3 mb-3 flex items-center gap-3 rounded-xl bg-on-background/20 px-3 py-3">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container text-sm font-bold text-on-secondary-container">
              {initialOf(user?.fullName)}
            </span>
            <span className="truncate text-sm font-semibold text-white">{user?.fullName ?? 'Cargando…'}</span>
          </div>

          <nav aria-label="Secciones" className="flex flex-col gap-1 px-3">
            {navItems
              .filter((item) => canAccess(user?.role, item.section))
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-2.5 text-white transition-all ${
                      isActive ? 'bg-primary-container font-bold shadow-sm' : 'hover:bg-surface-variant/10'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-xl text-white" aria-hidden="true">{item.icon}</span>
                  <span className="text-sm text-white">{sectionLabels[item.section]}</span>
                </NavLink>
              ))}
          </nav>
        </div>

        <div className="p-3">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-white hover:bg-surface-variant/10"
            onClick={logout}
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">logout</span>
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
