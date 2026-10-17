import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { useCurrentUser, useLogout } from '@/features/auth/hooks'
import logoIsotipo from '@/assets/landing/logo-isotipo.png'
import { Brand } from '@/features/landing/Brand'
import { initialOf } from './initial'

/**
 * Editorial top navigation bar for customers.
 * Replaces the sidebar with a prominent top navbar following the Pikka client design.
 */
export function CustomerNavbar() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#cce7ea] shadow-xs">
      <div className="h-20 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/mis-pedidos" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#14b8a6]/40 bg-[#001d1f] p-2 shadow-sm transition-colors group-hover:border-[#14b8a6]">
              <img
                alt="Pikka Nutria Isotipo"
                src={logoIsotipo}
                className="h-full w-full object-contain brightness-0 invert"
              />
            </div>
            <Brand variant="deep" showIsotipo={false} textSize="text-2xl" />
          </Link>
        </div>

        {/* Central Top Navigation Bar */}
        <nav
          aria-label="Secciones"
          className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-[#e8f7f9] border border-[#cce7ea]"
        >
          <NavLink
            to="/mis-pedidos"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white text-[#004b4e] shadow-xs font-bold'
                  : 'text-[#557b7f] hover:text-[#061f23] hover:bg-white/50'
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px]">package_2</span>
            <span>Mis Pedidos</span>
          </NavLink>
          <NavLink
            to="/catalogo"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white text-[#004b4e] shadow-xs font-bold'
                  : 'text-[#557b7f] hover:text-[#061f23] hover:bg-white/50'
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            <span>Catálogo</span>
          </NavLink>
        </nav>

        {/* Right: User Profile */}
        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2 pl-2 sm:pl-3 py-1 pr-2 rounded-full bg-[#e8f7f9] border border-[#cce7ea]">
            <span className="sr-only">Cliente</span>
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#004b4e] font-mono text-xs font-bold text-[#2dd4bf] border border-[#14b8a6]/40 shadow-xs"
            >
              {initialOf(user?.fullName)}
            </span>
            <div className="hidden xl:flex flex-col text-left pr-1 leading-tight">
              <span className="text-xs font-bold text-[#061f23] truncate max-w-[120px]">
                {user?.fullName ?? 'Cliente'}
              </span>
              <span className="text-[10px] font-mono text-[#006b5f] font-semibold">
                CLIENTE VERIFICADO
              </span>
            </div>
            <button
              type="button"
              aria-label="Cerrar sesión"
              className="cursor-pointer rounded-lg p-1 text-[#557b7f] hover:text-[#ba1a1a] hover:bg-white/60 transition-colors flex items-center gap-1 font-mono text-xs"
              onClick={logout}
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">logout</span>
              <span className="hidden sm:inline text-xs font-bold">Cerrar sesión</span>
            </button>
          </div>

          {/* Mobile Menu Button (< md) */}
          <button
            type="button"
            aria-label="Abrir menú"
            className="md:hidden cursor-pointer rounded-lg p-2 text-[#004b4e] hover:bg-[#e8f7f9] transition-colors"
            onClick={() => { setMobileMenuOpen(!mobileMenuOpen) }}
          >
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen ? (
        <div className="md:hidden border-t border-[#cce7ea] bg-white px-4 py-3 shadow-lg space-y-2">
          <nav aria-label="Secciones móviles" className="flex flex-col gap-1">
            <NavLink
              to="/mis-pedidos"
              onClick={() => { setMobileMenuOpen(false) }}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive ? 'bg-[#004b4e] text-white font-bold' : 'text-[#061f23] hover:bg-[#e8f7f9]'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">package_2</span>
              <span>Mis Pedidos</span>
            </NavLink>
            <NavLink
              to="/catalogo"
              onClick={() => { setMobileMenuOpen(false) }}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive ? 'bg-[#004b4e] text-white font-bold' : 'text-[#061f23] hover:bg-[#e8f7f9]'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              <span>Catálogo &amp; Pedir</span>
            </NavLink>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
