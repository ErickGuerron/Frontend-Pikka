import { AuthShell } from '../../components/AuthShell'
import { LoginForm } from '../../features/auth/LoginForm'

export default function LoginRoute() {
  return (
    <AuthShell title="Inicia sesión" subtitle="Ingresa para seguir tus pedidos.">
      <LoginForm />
    </AuthShell>
  )
}
