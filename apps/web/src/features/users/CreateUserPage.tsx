import { useMutation } from '@tanstack/react-query'
import { useState, type SyntheticEvent } from 'react'
import { joinFullName, missingPasswordRulesMessage, validateEmail, validateNamePart } from '@/features/auth/signup-validation'
import { assignableRoles, roleLabels, type Role } from '@/features/auth/types'
import { userMessage } from '@/shared/api/errors'
import { ErrorMessage } from '@/shared/ui/form'
import { sanitizeNameInput } from '@/shared/validation/contact'
import { createUser, type NewUser } from './api'

const empty = { nombre: '', apellido: '', email: '', password: '', role: 'OPERATOR' as Role }
type Form = typeof empty

export function CreateUserPage() {
  const [form, setForm] = useState<Form>(empty)
  const [submitted, setSubmitted] = useState(false)
  const mutation = useMutation({ mutationFn: createUser, onSuccess: () => { setForm(empty); setSubmitted(false) } })

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const errors = {
    nombre: validateNamePart(form.nombre, 'Ingresa el nombre.'),
    apellido: validateNamePart(form.apellido, 'Ingresa el apellido.'),
    email: validateEmail(form.email),
    password: form.password === '' ? 'Ingresa la contraseña inicial.' : missingPasswordRulesMessage(form.password),
  }
  const shown = (key: keyof typeof errors) => (submitted ? errors[key] : undefined)

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some((message) => message !== undefined)) return
    const user: NewUser = { email: form.email.trim(), password: form.password, role: form.role, fullName: joinFullName(form.nombre, form.apellido) }
    mutation.mutate(user)
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

        <form className="flex flex-col gap-4" noValidate onSubmit={onSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[#557b7f] font-semibold">
              Nombre
            </span>
            <input
              maxLength={59}
              value={form.nombre}
              aria-invalid={shown('nombre') ? true : undefined}
              onChange={(e) => { update('nombre', sanitizeNameInput(e.target.value)) }}
              className="px-3.5 py-2 rounded-lg border border-[#cce7ea] text-xs font-sans text-[#061f23] bg-white focus:outline-none focus:border-[#004b4e] focus:ring-1 focus:ring-[#004b4e] transition-all"
            />
            {shown('nombre') && <ErrorMessage>{shown('nombre')}</ErrorMessage>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[#557b7f] font-semibold">
              Apellido
            </span>
            <input
              maxLength={59}
              value={form.apellido}
              aria-invalid={shown('apellido') ? true : undefined}
              onChange={(e) => { update('apellido', sanitizeNameInput(e.target.value)) }}
              className="px-3.5 py-2 rounded-lg border border-[#cce7ea] text-xs font-sans text-[#061f23] bg-white focus:outline-none focus:border-[#004b4e] focus:ring-1 focus:ring-[#004b4e] transition-all"
            />
            {shown('apellido') && <ErrorMessage>{shown('apellido')}</ErrorMessage>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[#557b7f] font-semibold">
              Correo
            </span>
            <input
              type="email"
              maxLength={254}
              aria-invalid={shown('email') ? true : undefined}
              value={form.email}
              onChange={(e) => { update('email', e.target.value) }}
              className="px-3.5 py-2 rounded-lg border border-[#cce7ea] text-xs font-sans text-[#061f23] bg-white focus:outline-none focus:border-[#004b4e] focus:ring-1 focus:ring-[#004b4e] transition-all"
            />
            {shown('email') && <ErrorMessage>{shown('email')}</ErrorMessage>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[#557b7f] font-semibold">
              Contraseña inicial
            </span>
            <input
              type="password"
              autoComplete="new-password"
              maxLength={72}
              aria-invalid={shown('password') ? true : undefined}
              value={form.password}
              onChange={(e) => { update('password', e.target.value) }}
              className="px-3.5 py-2 rounded-lg border border-[#cce7ea] text-xs font-sans text-[#061f23] bg-white focus:outline-none focus:border-[#004b4e] focus:ring-1 focus:ring-[#004b4e] transition-all"
            />
            {shown('password') && <ErrorMessage>{shown('password')}</ErrorMessage>}
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
