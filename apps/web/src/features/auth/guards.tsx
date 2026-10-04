import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useCurrentUser } from './hooks'
import { useSession } from './session-store'
import type { Role } from './types'

/** Exige sesión. La autorización real la hace el backend; esto solo ordena la navegación. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useSession((s) => s.token)
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

/** Oculta pantallas a roles que el backend rechazaría de todos modos. */
export function RequireRole({ roles, children }: { roles: readonly Role[]; children: ReactNode }) {
  const { data: user, isPending } = useCurrentUser()
  if (isPending) return <p className="muted">Cargando…</p>
  if (!user || !roles.includes(user.role)) {
    return (
      <section className="card">
        <h2>Sin acceso</h2>
        <p className="muted">Tu rol no tiene permiso para esta sección.</p>
      </section>
    )
  }
  return children
}
