import { Redirect, Stack } from 'expo-router'
import { useGuard } from '../../features/auth/use-guard'

export default function AuthLayout() {
  const redirect = useGuard('auth')
  if (redirect) return <Redirect href={redirect} />
  return <Stack screenOptions={{ headerShown: false }} />
}
