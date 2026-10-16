import { NavLink } from 'react-router'
import { useCurrentUser, useLogout } from '@/features/auth/hooks'
import { Brand } from '@/features/landing/Brand'
import { initialOf } from './initial'
import { canAccess, customerHomePath, sectionLabels, type Section } from '@/features/auth/permissions'

const navItems: { section: Section; to: string; icon: string }[] = [
  { section: 'myOrders', to: customerHomePath, icon: 'package_2' },
  { section: 'catalog', to: '/catalogo', icon: 'storefront' },
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
      {open ? <div aria-hidden="true" className="fixed inset-0 z-40 bg-[#002628]/60 backdrop-blur-xs lg:hidden" onClick={onClose} /> : null}
      <aside
        aria-label="Menú de cliente"
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col justify-between bg-[#002628] border-r border-[#14b8a6]/20 shadow-xl transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          <div className="flex h-16 items-center justify-between border-b border-[#14b8a6]/20 bg-[#001d1f] px-4">
            <Brand variant="white" showIsotipo textSize="text-xl" />
            <span className="rounded font-mono border border-[#14b8a6]/40 bg-[#004b4e] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2dd4bf]">
              Cliente
            </span>
          </div>

          <div className="mx-3 my-3 flex items-center gap-3 rounded-lg border border-[#14b8a6]/20 bg-[#001d1f] p-3">
            <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004b4e] font-mono text-xs font-bold text-[#2dd4bf] border border-[#14b8a6]/30">
              {initialOf(user?.fullName)}
            </span>
            <span className="truncate text-xs font-semibold text-white">{user?.fullName ?? 'Cargando…'}</span>
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
