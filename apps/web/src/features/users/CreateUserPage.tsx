import { useMutation } from '@tanstack/react-query'
import { useState, type SyntheticEvent } from 'react'
import { assignableRoles, roleLabels, type Role } from '@/features/auth/types'
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
    <div className="max-w-xl">
      <section className="bg-white rounded-xl border border-[#cce7ea] p-6 shadow-sm">
        <div className="border-b border-[#cce7ea] pb-4 mb-5 space-y-1">
          <div className="inline-flex items-center gap-2 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
            <span className="font-semibold">DOSSIER SEGURIDAD · ALTA DE USUARIO</span>
          </div>
          <h2 className="text-xl font-bold text-[#004b4e] font-sans">Nuevo usuario</h2>
          <p className="text-xs font-mono text-[#557b7f]">
            Registra una nueva credencial con rol y permisos asignados en la plataforma.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[#557b7f] font-semibold">
              Nombre completo
            </span>
            <input
              required
              maxLength={120}
              value={form.fullName}
              onChange={(e) => { update('fullName', e.target.value) }}
              className="px-3.5 py-2 rounded-lg border border-[#cce7ea] text-xs font-sans text-[#061f23] bg-white focus:outline-none focus:border-[#004b4e] focus:ring-1 focus:ring-[#004b4e] transition-all"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[#557b7f] font-semibold">
              Correo
            </span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => { update('email', e.target.value) }}
              className="px-3.5 py-2 rounded-lg border border-[#cce7ea] text-xs font-sans text-[#061f23] bg-white focus:outline-none focus:border-[#004b4e] focus:ring-1 focus:ring-[#004b4e] transition-all"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[#557b7f] font-semibold">
              Contraseña inicial
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={form.password}
              onChange={(e) => { update('password', e.target.value) }}
              className="px-3.5 py-2 rounded-lg border border-[#cce7ea] text-xs font-sans text-[#061f23] bg-white focus:outline-none focus:border-[#004b4e] focus:ring-1 focus:ring-[#004b4e] transition-all"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[#557b7f] font-semibold">
              Rol
            </span>
            <select
              value={form.role}
              onChange={(e) => { const r = assignableRoles.find((x) => x === e.target.value); if (r) update('role', r satisfies Role) }}
              className="px-3.5 py-2 rounded-lg border border-[#cce7ea] text-xs font-sans text-[#061f23] bg-white focus:outline-none focus:border-[#004b4e] focus:ring-1 focus:ring-[#004b4e] transition-all"
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>{roleLabels[r]}</option>
              ))}
            </select>
          </label>

          {mutation.isError && (
            <div role="alert" className="p-3 rounded-lg bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] font-mono text-xs">
              {userMessage(mutation.error)}
            </div>
          )}
          {mutation.isSuccess && (
            <div role="status" className="p-3 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-mono text-xs font-semibold">
              Usuario {mutation.data.email} creado como {roleLabels[mutation.data.role]}.
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors border border-[#004b4e] shadow-sm"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
