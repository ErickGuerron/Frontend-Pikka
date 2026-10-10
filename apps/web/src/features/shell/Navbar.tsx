import { NavLink } from 'react-router'
import { useCurrentUser } from '@/features/auth/hooks'

const navItems = [
  { to: '/', label: 'Inicio', icon: 'dashboard', end: true },
  { to: '/orders', label: 'Pedidos', icon: 'package_2' },
  { to: '/zones', label: 'Zonas', icon: 'map' },
  { to: '/routes', label: 'Rutas', icon: 'alt_route' },
  { to: '/drivers', label: 'Repartidores', icon: 'two_wheeler' },
  { to: '/tracking', label: 'Seguimiento', icon: 'radar' },
  { to: '/users', label: 'Usuarios', icon: 'group' },
]

export function Navbar() {
  const { data: user } = useCurrentUser()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-inverse-surface z-50 flex flex-col justify-between shadow-[0_8px_24px_-4px_rgba(19,42,47,0.16)]">
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-space-md flex items-center justify-between bg-on-background/20">
          <div className="flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-full bg-primary/40 flex items-center justify-center overflow-hidden">
              <img
                alt="Mascota Pikka"
                className="w-7 h-7 object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1U5476N65UG5b8LIbeNyDiuL6dGo2gG2HEOhVi9vj2tUpaaCovo_E6gEzkEt6u04W6yfTBUl47aKPbH1tGrq1r2wtsHp6XzyCnnibHcbcLK0AqYzFDsh7xKYhzAUuxUcVjX-GuUygXythMCzrSlU4i_JlUmWymebVv6GNZEvTGg9L-EG32qvvVNaY-mcyPg1YSXfE_y5bwB26nBdZg8tXdF9Tl5TcTQXhzWKhpZ6r11Rr5aNHfMngsi1EeQTHLzR_jcR6IIARwnEQ"
              />
            </div>
            <span className="font-headline-md text-headline-md tracking-tight text-white font-bold lowercase flex items-center">
              p
              <span className="relative inline-block">
                i
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-secondary-container rounded-full" />
              </span>
              kka
            </span>
          </div>
          <span className="font-label-badge text-label-badge uppercase tracking-wider text-secondary-fixed bg-primary-container/80 px-2 py-0.5 rounded-full">
            Ops
          </span>
        </div>

        {/* Panel Label */}
        <div className="px-space-md pt-space-md pb-space-xs">
          <span className="font-label-badge text-label-badge uppercase tracking-wider text-outline-variant font-bold">
            Panel de Control
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-space-sm">
          {navItems.map((item) => {
            // Hide users link for non-admins
            if (item.to === '/users' && user?.role !== 'ADMIN') return null
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-md py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary-container text-white font-bold shadow-[0_1px_8px_rgba(0,0,0,0.08)]'
                      : 'text-white hover:bg-surface-variant/10 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined text-xl text-white">{item.icon}</span>
                <span className="font-body-md text-body-md text-white">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Bottom Section: Status */}
      <div className="p-space-md bg-on-background/15 m-space-sm rounded-xl flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-label-badge text-label-badge text-outline-variant uppercase">Red Logística</span>
          <span className="font-body-sm text-body-sm text-secondary-fixed font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
            En línea
          </span>
        </div>
        <span className="font-label-code text-label-code text-white opacity-60">v2.4</span>
      </div>
    </aside>
  )
}
