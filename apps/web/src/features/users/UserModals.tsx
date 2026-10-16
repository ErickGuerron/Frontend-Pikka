import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState, type SyntheticEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { missingPasswordRulesMessage, validateEmail } from '@/features/auth/signup-validation'
import { assignableRoles, roleLabels, type Role, type User } from '@/features/auth/types'
import { userMessage } from '@/shared/api/errors'
import { ErrorMessage, Field, inputClass } from '@/shared/ui/form'
import { createUser, deactivateUser, updateUser, usersKey, type NewUser, type UserChanges } from './api'
import { roleIcons } from './roleIcons'

const MAX_FULL_NAME = 120

const roleDescriptions: Record<Role, { title: string; description: string }> = {
  ADMIN: {
    title: 'Administrador de Sistema',
    description: 'Acceso total y configuración de centros de distribución, roles y auditoría de la plataforma.',
  },
  OPERATOR: {
    title: 'Operador de Despacho',
    description: 'Gestión de rutas diarias, manifiestos de paquetes y supervisión de flota en tiempo real.',
  },
  DRIVER: {
    title: 'Repartidor / Flota Móvil',
    description: 'Acceso a la app de entregas Pikka, confirmación con firma/foto y telemetría de ruta.',
  },
  CUSTOMER: {
    title: 'Cliente',
    description: 'Cuenta creada por autoregistro para solicitar y seguir sus pedidos.',
  },
}

function fullNameError(value: string): string | undefined {
  const name = value.trim()
  if (name === '') return 'Ingresa el nombre completo.'
  if (Array.from(name).length > MAX_FULL_NAME) return `Admite hasta ${String(MAX_FULL_NAME)} caracteres.`
  return undefined
}

// ─── Piezas compartidas ─────────────────────────────────────────────────────

interface DialogProps {
  labelId: string
  role?: 'dialog' | 'alertdialog'
  wide?: boolean
  onClose: () => void
  children: ReactNode
}

/** Diálogo accesible: Escape cierra y el foco vuelve al elemento que lo abrió. */
function Dialog({ labelId, role = 'dialog', wide = true, onClose, children }: DialogProps) {
  // Se captura al montar, cuando el disparador aún tiene el foco.
  const [opener] = useState<HTMLElement | null>(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('overflow-hidden')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('overflow-hidden')
      opener?.focus()
    }
  }, [opener])

  return (
    <div
      aria-labelledby={labelId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role={role}
    >
      <div aria-hidden="true" className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm" onClick={() => { closeRef.current() }} />
      <div
        className={`relative w-full ${wide ? 'max-w-xl' : 'max-w-md'} bg-surface-container-lowest rounded-2xl shadow-[0_20px_50px_rgba(6,31,35,0.25)] border border-surface-container overflow-hidden z-10`}
      >
        {children}
      </div>
    </div>
  )
}

interface DialogHeaderProps {
  titleId: string
  icon: string
  title: string
  subtitle: string
  onClose: () => void
}

function DialogHeader({ titleId, icon, title, subtitle, onClose }: DialogHeaderProps) {
  return (
    <>
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-secondary-container" />
      <div className="px-space-lg pt-space-lg pb-4 flex items-start justify-between border-b border-surface-container-low">
        <div className="flex items-center gap-space-sm">
          <div className="w-11 h-11 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary shadow-xs">
            <span aria-hidden="true" className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <div>
            <h2 className="font-headline-md text-on-surface font-bold leading-tight" id={titleId}>{title}</h2>
            <p className="font-body-sm text-on-surface-variant">{subtitle}</p>
          </div>
        </div>
        <button
          aria-label="Cerrar modal"
          className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          onClick={onClose}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
    </>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | undefined
}

function TextField({ label, error, ...input }: TextFieldProps) {
  const errorId = useId()
  return (
    <div className="flex flex-col gap-1">
      <Field label={label}>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className={inputClass}
          {...input}
        />
      </Field>
      {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
    </div>
  )
}

function RoleRadios({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Rol asignado</legend>
      <div className="grid grid-cols-3 gap-2.5">
        {assignableRoles.map((r) => (
          <label key={r} className="cursor-pointer">
            <input
              checked={value === r}
              className="peer sr-only"
              name="role"
              onChange={() => { onChange(r) }}
              type="radio"
              value={r}
            />
            <div className="p-3 rounded-xl bg-surface-container-low border border-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary text-on-surface transition-all flex flex-col items-center text-center gap-1.5 hover:bg-surface-container shadow-xs">
              <span aria-hidden="true" className="material-symbols-outlined text-2xl">{roleIcons[r]}</span>
              <span className="font-label-badge uppercase font-bold">{roleLabels[r]}</span>
            </div>
          </label>
        ))}
      </div>
      <div className="bg-surface-container p-3 rounded-xl flex items-start gap-2.5">
        <span aria-hidden="true" className="material-symbols-outlined text-primary text-lg mt-0.5">verified_user</span>
        <div className="flex flex-col">
          <span className="font-body-sm font-bold text-primary">{roleDescriptions[value].title}</span>
          <span className="font-body-sm text-on-surface-variant">{roleDescriptions[value].description}</span>
        </div>
      </div>
    </fieldset>
  )
}

const footerButtonClass =
  'px-space-md py-2.5 rounded-xl font-body-md font-semibold text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer'
const primaryButtonClass =
  'flex items-center gap-2 bg-primary hover:bg-on-primary-fixed-variant text-on-primary px-space-lg py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 font-body-md font-bold cursor-pointer disabled:opacity-50'

// ─── Crear ──────────────────────────────────────────────────────────────────

const emptyUser: NewUser = { email: '', password: '', fullName: '', role: 'OPERATOR' }

export interface CreateUserModalProps {
  onClose: () => void
  onCreated: () => void
}

export function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const titleId = useId()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<NewUser>(emptyUser)
  const [submitted, setSubmitted] = useState(false)

  const errors = {
    fullName: fullNameError(form.fullName),
    email: form.email.trim() === '' ? 'Ingresa el correo del usuario.' : validateEmail(form.email),
    password: missingPasswordRulesMessage(form.password),
  }
  const hasErrors = Object.values(errors).some((message) => message !== undefined)

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersKey })
      onCreated()
      onClose()
    },
  })

  const update = <K extends keyof NewUser>(key: K, value: NewUser[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
    if (hasErrors) return
    mutation.mutate({ ...form, email: form.email.trim(), fullName: form.fullName.trim() })
  }

  return (
    <Dialog labelId={titleId} onClose={onClose}>
      <DialogHeader
        icon="person_add"
        onClose={onClose}
        subtitle="Configura las credenciales de acceso y el rol en la red Pikka."
        title="Crear Nuevo Usuario"
        titleId={titleId}
      />
      <form className="p-space-lg flex flex-col gap-4 max-h-[calc(85vh-140px)] overflow-y-auto" noValidate onSubmit={onSubmit}>
        <TextField
          autoFocus
          error={submitted ? errors.fullName : undefined}
          label="Nombre completo"
          onChange={(e) => { update('fullName', e.target.value) }}
          value={form.fullName}
        />
        <TextField
          autoComplete="off"
          error={submitted ? errors.email : undefined}
          label="Correo"
          onChange={(e) => { update('email', e.target.value) }}
          type="email"
          value={form.email}
        />
        <TextField
          autoComplete="new-password"
          error={submitted ? errors.password : undefined}
          label="Contraseña provisional"
          onChange={(e) => { update('password', e.target.value) }}
          type="password"
          value={form.password}
        />
        <p className="font-body-sm text-on-surface-variant">El usuario deberá renovar su contraseña en el primer inicio de sesión.</p>
        <RoleRadios onChange={(role) => { update('role', role) }} value={form.role} />

        {mutation.isError && <ErrorMessage>{userMessage(mutation.error)}</ErrorMessage>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-low mt-2">
          <button className={footerButtonClass} onClick={onClose} type="button">Cancelar</button>
          <button className={primaryButtonClass} disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Creando…' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Editar ─────────────────────────────────────────────────────────────────

export interface EditUserModalProps {
  user: User
  onClose: () => void
}

export function EditUserModal({ user, onClose }: EditUserModalProps) {
  const titleId = useId()
  const queryClient = useQueryClient()
  const roleLocked = user.role === 'CUSTOMER'
  const [fullName, setFullName] = useState(user.fullName)
  const [role, setRole] = useState<Role>(user.role)
  const [submitted, setSubmitted] = useState(false)
  const nameError = fullNameError(fullName)

  const mutation = useMutation({
    mutationFn: (changes: UserChanges) => updateUser(user.id, changes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersKey })
      onClose()
    },
  })

  const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
    if (nameError) return
    const name = fullName.trim()
    // Los clientes no cambian de rol aquí: el backend solo asigna ADMIN, OPERATOR y DRIVER.
    mutation.mutate(roleLocked ? { fullName: name } : { fullName: name, role })
  }

  return (
    <Dialog labelId={titleId} onClose={onClose}>
      <DialogHeader
        icon="edit"
        onClose={onClose}
        subtitle="Cambia el nombre o el rol. El correo no se puede modificar."
        title="Editar Usuario"
        titleId={titleId}
      />
      <form className="p-space-lg flex flex-col gap-4 max-h-[calc(85vh-140px)] overflow-y-auto" noValidate onSubmit={onSubmit}>
        <TextField
          autoFocus
          error={submitted ? nameError : undefined}
          label="Nombre completo"
          onChange={(e) => { setFullName(e.target.value) }}
          value={fullName}
        />
        <TextField label="Correo" readOnly value={user.email} />
        {roleLocked ? (
          <p className="font-body-sm text-on-surface-variant">
            Rol: <span className="font-bold text-on-surface">{roleLabels[user.role]}</span>. Los clientes no cambian de rol desde esta pantalla.
          </p>
        ) : (
          <RoleRadios onChange={setRole} value={role} />
        )}

        {mutation.isError && <ErrorMessage>{userMessage(mutation.error)}</ErrorMessage>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-low mt-2">
          <button className={footerButtonClass} onClick={onClose} type="button">Cancelar</button>
          <button className={primaryButtonClass} disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Desactivar ─────────────────────────────────────────────────────────────

export interface DeactivateUserDialogProps {
  user: User
  onClose: () => void
}

export function DeactivateUserDialog({ user, onClose }: DeactivateUserDialogProps) {
  const titleId = useId()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deactivateUser(user.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersKey })
      onClose()
    },
  })

  return (
    <Dialog labelId={titleId} onClose={onClose} role="alertdialog" wide={false}>
      <div className="p-space-lg flex flex-col gap-4">
        <h2 className="font-headline-md text-on-surface font-bold leading-tight" id={titleId}>
          Desactivar a {user.fullName}
        </h2>
        <p className="font-body-sm text-on-surface-variant">
          El usuario dejará de poder iniciar sesión. Su historial se conserva: no se borra nada.
        </p>

        {mutation.isError && <ErrorMessage>{userMessage(mutation.error)}</ErrorMessage>}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button className={footerButtonClass} onClick={onClose} type="button">Cancelar</button>
          <button
            className="px-space-lg py-2.5 rounded-xl bg-error-container text-on-error-container font-body-md font-bold cursor-pointer disabled:opacity-50"
            disabled={mutation.isPending}
            onClick={() => { mutation.mutate() }}
            type="button"
          >
            {mutation.isPending ? 'Desactivando…' : 'Desactivar usuario'}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
