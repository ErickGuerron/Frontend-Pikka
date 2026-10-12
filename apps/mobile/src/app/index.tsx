import { Redirect } from 'expo-router'
import { useSessionStore } from '../store/session-store'

/** Entry route: customers go to their orders, everyone else to login. */
export default function Index() {
  const token = useSessionStore((s) => s.token)
  const role = useSessionStore((s) => s.role)
  return <Redirect href={token !== null && role === 'CUSTOMER' ? '/mis-pedidos' : '/login'} />
}
