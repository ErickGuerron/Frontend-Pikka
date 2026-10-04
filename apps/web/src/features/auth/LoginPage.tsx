import { useState, type SyntheticEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { userMessage } from '@/shared/api/errors'
import { useLogin } from './hooks'
import { useSession } from './session-store'

export function LoginPage() {
  const token = useSession((s) => s.token)
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const state: unknown = location.state
  const from = redirectTarget(state)

  if (token) return <Navigate to={from} replace />

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    loginMutation.mutate(
      { email: email.trim(), password },
      { onSuccess: () => void navigate(from, { replace: true }) },
    )
  }

  return (
    <main className="login">
      <form className="card login__card" onSubmit={onSubmit} noValidate>
        <h1 className="login__brand">Pikka</h1>
        <p className="muted">Gestión de entregas y rutas</p>

        <label className="field">
          <span>Correo</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => { setEmail(e.target.value) }} />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => { setPassword(e.target.value) }} />
        </label>

        {loginMutation.isError && (
          <p role="alert" className="alert">
            {userMessage(loginMutation.error)}
          </p>
        )}

        <button type="submit" className="button" disabled={loginMutation.isPending || !email || !password}>
          {loginMutation.isPending ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  )
}

/** Ruta a la que volver tras el login, guardada por RequireAuth. Solo rutas internas. */
function redirectTarget(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string' && state.from.startsWith('/')) {
    return state.from
  }
  return '/'
}
