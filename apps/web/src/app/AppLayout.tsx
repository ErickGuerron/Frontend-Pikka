import { NavLink, Outlet } from 'react-router'
import { useCurrentUser, useLogout } from '@/features/auth/hooks'
import { roleLabels } from '@/features/auth/types'

const nav = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/orders', label: 'Pedidos' },
  { to: '/zones', label: 'Zonas' },
  { to: '/routes', label: 'Rutas' },
  { to: '/drivers', label: 'Repartidores' },
  { to: '/tracking', label: 'Seguimiento' },
]

export function AppLayout() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__brand">Pikka</div>
        <nav aria-label="Principal">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end ?? false} className="sidebar__link">
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <NavLink to="/users/new" className="sidebar__link">
              Usuarios
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="content">
        <header className="topbar">
          <span>
            {user ? (
              <>
                <strong>{user.fullName}</strong> <span className="muted">· {roleLabels[user.role]}</span>
              </>
            ) : (
              <span className="muted">Cargando…</span>
            )}
          </span>
          <button type="button" className="button button--ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
