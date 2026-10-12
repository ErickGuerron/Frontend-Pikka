import { AuthShell } from '../../components/AuthShell'
import { SignupForm } from '../../features/auth/SignupForm'

export default function SignupRoute() {
  return (
    <AuthShell title="Crea tu cuenta" subtitle="Regístrate para hacer y seguir tus pedidos.">
      <SignupForm />
    </AuthShell>
  )
}
