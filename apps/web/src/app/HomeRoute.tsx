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
    <div role="alert" className="mb-4 flex items-center gap-2 bg-[#ffdad6]/60 border border-[#ffdad6] text-[#ba1a1a] px-4 py-3 rounded-lg font-mono text-xs font-semibold">
      <span className="material-symbols-outlined text-base">warning</span>
      <span>No tienes acceso a {denied}.</span>
    </div>
  )
}

function MobileOnlyPage() {
  return (
    <div className="pt-2 pb-16 font-sans">
      <div className="bg-white rounded border border-[#cce7ea] p-6 shadow-sm flex flex-col gap-3 max-w-xl">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#e8f7f9] border border-[#cce7ea] text-[10px] font-mono tracking-widest uppercase text-[#004b4e] w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" />
          <span>Acceso Restringido · Flota Móvil</span>
        </div>
        <h2 className="text-2xl font-bold text-[#004b4e] font-sans">Usa la app móvil de Pikka</h2>
        <p className="text-xs sm:text-sm text-[#557b7f] font-normal leading-relaxed">
          La web es para el personal y los clientes. Como repartidor, consulta tu ruta y registra tus entregas desde la app móvil.
        </p>
      </div>
    </div>
  )
}

function useDeniedSection(): string | null {
  const state: unknown = useLocation().state
  if (typeof state === 'object' && state !== null && 'deniedSection' in state && typeof state.deniedSection === 'string') {
    return state.deniedSection
  }
  return null
}
