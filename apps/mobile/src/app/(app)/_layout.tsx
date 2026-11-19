import { Redirect, Stack, usePathname } from 'expo-router'
import { sectionRedirect } from '../../features/auth/guards'
import { useGuard } from '../../features/auth/use-guard'
import { useSessionStore } from '../../store/session-store'
import { colors } from '../../theme/colors'

export default function AppLayout() {
  const redirect = useGuard('app')
  const role = useSessionStore((s) => s.role)
  const pathname = usePathname()
  const sectionHome = role !== null ? sectionRedirect(role, pathname) : null
  if (redirect) return <Redirect href={redirect} />
  if (sectionHome !== null) return <Redirect href={sectionHome} />
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: colors.onPrimary, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="mis-pedidos/index" options={{ headerShown: false }} />
      <Stack.Screen name="mis-pedidos/nuevo" options={{ title: 'Hacer nuevo pedido', presentation: 'modal' }} />
      <Stack.Screen name="mis-pedidos/[id]" options={{ title: 'Detalle del pedido' }} />
      <Stack.Screen name="ruta/index" options={{ headerShown: false }} />
    </Stack>
  )
}
