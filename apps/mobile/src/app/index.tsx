import { Redirect } from 'expo-router'
import { homePathFor, isMobileRole } from '../features/auth/guards'
import { useSessionStore } from '../store/session-store'

/** Entry route: each mobile role goes to its section, everyone else to login. */
export default function Index() {
  const token = useSessionStore((s) => s.token)
  const role = useSessionStore((s) => s.role)
  const home = token !== null && role !== null && isMobileRole(role) ? homePathFor(role) : '/login'
  return <Redirect href={home} />
}
