import { Navigate, useLocation } from 'react-router'
import { useCurrentUser } from '@/features/auth/hooks'
import { canAccess, customerHomePath, hasWebAccess } from '@/features/auth/permissions'
import { HomePage } from './HomePage'

/** Inicio: dashboard para el personal, Mis Pedidos para el cliente y una indicación de usar la app móvil para el repartidor. */
export function HomeRoute() {
  const { data: user, isPending, isError } = useCurrentUser()
  if (isPending) return <p className="muted">Cargando…</p>
  if (isError) return <p className="alert">No pudimos verificar tu sesión. Vuelve a iniciar sesión.</p>

  // Customers have their own home page.
  if (canAccess(user.role, 'myOrders')) return <Navigate to={customerHomePath} replace />

  return (
    <>
      <DeniedNotice />
      {hasWebAccess(user.role) ? <HomePage /> : <MobileOnlyPage />}
    </>
  )
}

function DeniedNotice() {
  const denied = useDeniedSection()
  if (denied === null) return null
  return (
    <p role="alert" className="alert">
      No tienes acceso a {denied}.
    </p>
  )
}

function MobileOnlyPage() {
  return (
    <section className="card">
      <h2>Usa la app móvil de Pikka</h2>
      <p className="muted">
        La web es para el personal y los clientes. Como repartidor, consulta tu ruta y registra tus entregas desde la app móvil.
      </p>
    </section>
  )
}

function useDeniedSection(): string | null {
  const state: unknown = useLocation().state
  if (typeof state === 'object' && state !== null && 'deniedSection' in state && typeof state.deniedSection === 'string') {
    return state.deniedSection
  }
  return null
}
