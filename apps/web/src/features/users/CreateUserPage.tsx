import { useMutation } from '@tanstack/react-query'
import { useState, type SyntheticEvent } from 'react'
import { roleLabels, roles, type Role } from '@/features/auth/types'
import { userMessage } from '@/shared/api/errors'
import { createUser, type NewUser } from './api'

const empty: NewUser = { email: '', password: '', fullName: '', role: 'OPERATOR' }

export function CreateUserPage() {
  const [form, setForm] = useState<NewUser>(empty)
  const mutation = useMutation({ mutationFn: createUser, onSuccess: () => { setForm(empty) } })

  const update = <K extends keyof NewUser>(key: K, value: NewUser[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutation.mutate({ ...form, email: form.email.trim(), fullName: form.fullName.trim() })
  }

  return (
    <section className="card">
      <h2>Nuevo usuario</h2>
      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span>Nombre completo</span>
          <input required maxLength={120} value={form.fullName} onChange={(e) => { update('fullName', e.target.value) }} />
        </label>
        <label className="field">
          <span>Correo</span>
          <input type="email" required value={form.email} onChange={(e) => { update('email', e.target.value) }} />
        </label>
        <label className="field">
          <span>Contraseña inicial</span>
          <input type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={form.password} onChange={(e) => { update('password', e.target.value) }} />
        </label>
        <label className="field">
          <span>Rol</span>
          <select value={form.role} onChange={(e) => { const r = roles.find((x) => x === e.target.value); if (r) update('role', r satisfies Role) }}>
            {roles.map((r) => (
              <option key={r} value={r}>{roleLabels[r]}</option>
            ))}
          </select>
        </label>

        {mutation.isError && <p role="alert" className="alert">{userMessage(mutation.error)}</p>}
        {mutation.isSuccess && (
          <p role="status" className="success">
            Usuario {mutation.data.email} creado como {roleLabels[mutation.data.role]}.
          </p>
        )}

        <button type="submit" className="button" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creando…' : 'Crear usuario'}
        </button>
      </form>
    </section>
  )
}
