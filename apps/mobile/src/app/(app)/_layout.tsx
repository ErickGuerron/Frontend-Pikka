import { Redirect, Stack } from 'expo-router'
import { useGuard } from '../../features/auth/use-guard'
import { colors } from '../../theme/colors'

export default function AppLayout() {
  const redirect = useGuard('app')
  if (redirect) return <Redirect href={redirect} />
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: colors.onPrimary, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="mis-pedidos/index" options={{ title: 'Mis pedidos' }} />
      <Stack.Screen name="mis-pedidos/nuevo" options={{ title: 'Hacer nuevo pedido', presentation: 'modal' }} />
      <Stack.Screen name="mis-pedidos/[id]" options={{ title: 'Detalle del pedido' }} />
    </Stack>
  )
}
