import { useEffect } from 'react'
import { useSessionStore } from '../../store/session-store'
import { decideRoute, type RouteGroup } from './guards'

/** Returns the href to redirect to (or null to render). Non-customer sessions are ended here. */
export function useGuard(group: RouteGroup): '/login' | '/mis-pedidos' | null {
  const hydrated = useSessionStore((s) => s.hydrated)
  const token = useSessionStore((s) => s.token)
  const role = useSessionStore((s) => s.role)
  const clear = useSessionStore((s) => s.clear)
  const decision = decideRoute({ hydrated, token, role, group })

  const signOut = decision.kind === 'sign-out'
  useEffect(() => {
    if (signOut) void clear()
  }, [signOut, clear])

  if (decision.kind === 'redirect' || decision.kind === 'sign-out') return decision.href
  return null
}
