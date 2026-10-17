import { AuthShell } from '../../components/AuthShell'
import { LoginForm } from '../../features/auth/LoginForm'

export default function LoginRoute() {
  return (
    <AuthShell mode="login">
      <LoginForm />
    </AuthShell>
  )
}
