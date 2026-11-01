import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useCurrentUser } from './hooks'
import { canAccess, sectionLabels, type Section } from './permissions'
import { LandingPage } from '@/features/landing/LandingPage'
import { useSession } from './session-store'

/** Exige sesión. La autorización real la hace el backend; esto solo ordena la navegación. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useSession((s) => s.token)
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

/** Raíz del sitio: la landing pública en `/` sin sesión; con sesión (o en rutas profundas) exige sesión. */
export function PublicIndexOrAuth({ children }: { children: ReactNode }) {
  const token = useSession((s) => s.token)
  const { pathname } = useLocation()
  if (!token && pathname === '/') return <LandingPage />
  return <RequireAuth>{children}</RequireAuth>
}

/**
 * Muestra la sección solo si el rol la tiene. Si no, lleva a Inicio con un aviso
 * para que el usuario sepa por qué no llegó a la página que pidió.
 */
export function RequireSection({ section, children }: { section: Section; children: ReactNode }) {
  const { data: user, isPending } = useCurrentUser()
  if (isPending) return <p className="muted">Cargando…</p>
  if (!canAccess(user?.role, section)) {
    return <Navigate to="/" replace state={{ deniedSection: sectionLabels[section] }} />
  }
  return children
}
