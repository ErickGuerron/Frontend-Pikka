import { NavLink } from 'react-router'
import { useCurrentUser } from '@/features/auth/hooks'
import { canAccess, sectionLabels, type Section } from '@/features/auth/permissions'
import { Brand } from '@/features/landing/Brand'

const navItems: { section: Section; to: string; icon: string; end?: boolean }[] = [
  { section: 'home', to: '/', icon: 'dashboard', end: true },
  { section: 'orders', to: '/orders', icon: 'package_2' },
  { section: 'exceptions', to: '/exceptions', icon: 'fact_check' },
  { section: 'zones', to: '/zones', icon: 'map' },
  { section: 'routes', to: '/routes', icon: 'alt_route' },
  { section: 'drivers', to: '/drivers', icon: 'two_wheeler' },
  { section: 'tracking', to: '/tracking', icon: 'radar' },
  { section: 'products', to: '/productos', icon: 'inventory_2' },
  { section: 'users', to: '/users', icon: 'group' },
]

export function Navbar() {
  const { data: user } = useCurrentUser()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#002628] border-r border-[#14b8a6]/20 z-50 flex flex-col justify-between text-white font-mono shadow-[0_8px_24px_-4px_rgba(0,38,40,0.3)]">
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#14b8a6]/20 bg-[#001d1f]">
          <NavLink to="/" className="flex items-center">
            <Brand variant="white" showIsotipo textSize="text-xl" />
          </NavLink>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#2dd4bf] bg-[#004b4e] border border-[#14b8a6]/40 px-2 py-0.5 rounded font-bold">
            Ops
          </span>
        </div>

        {/* Panel Label */}
        <div className="px-4 pt-4 pb-2">
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#89d3d6] font-semibold block">
            // CONSOLA CENTRAL
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 text-xs font-mono tracking-wider uppercase">
          {navItems
            .filter((item) => canAccess(user?.role, item.section))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2.5 rounded transition-all ${
                    isActive
                      ? 'bg-[#004b4e] !text-white border border-[#14b8a6]/40 font-bold shadow-sm'
                      : '!text-[#cce7ea] hover:bg-white/10 hover:!text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-lg transition-colors ${
                          isActive ? '!text-[#2dd4bf]' : '!text-[#89d3d6] group-hover:!text-white'
                        }`}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <span
                        className={`transition-colors ${
                          isActive ? '!text-white font-bold' : '!text-[#cce7ea] group-hover:!text-white'
                        }`}
                      >
                        {sectionLabels[item.section]}
                      </span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-ping" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
        </nav>
      </div>

      {/* Bottom Section: Telemetry Status */}
      <div className="p-3.5 m-3 rounded bg-[#001d1f] border border-[#14b8a6]/25 flex flex-col gap-1 text-[11px]">
        <div className="flex items-center justify-between text-[10px] text-[#89d3d6] uppercase tracking-wider font-semibold">
          <span>Red Logística</span>
          <span className="text-[10px] font-mono text-white/60">v2.4</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-[#14b8a6]/20">
          <div className="flex items-center gap-1.5 text-[#2dd4bf] font-semibold text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse" />
            <span>En línea</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
