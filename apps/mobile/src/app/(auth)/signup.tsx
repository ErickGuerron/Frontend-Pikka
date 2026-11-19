import { AuthShell } from '../../components/AuthShell'
import { SignupForm } from '../../features/auth/SignupForm'

export default function SignupRoute() {
  return (
    <AuthShell mode="signup">
      <SignupForm />
    </AuthShell>
  )
}
