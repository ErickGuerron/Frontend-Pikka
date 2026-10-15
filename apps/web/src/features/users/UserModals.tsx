import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState, type SyntheticEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { evaluatePasswordRules, joinFullName, missingPasswordRulesMessage, validateEmail, type PasswordRuleId } from '@/features/auth/signup-validation'
import { assignableRoles, roleLabels, type Role, type User } from '@/features/auth/types'
import { userMessage } from '@/shared/api/errors'
import { ErrorMessage, fieldLabelClass, inputClass } from '@/shared/ui/form'
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

/** Nombre y apellido son obligatorios; el conjunto debe caber en el límite del backend. */
function nameErrors(nombre: string, apellido: string): { nombre?: string; apellido?: string } {
  const errors: { nombre?: string; apellido?: string } = {}
  if (nombre.trim() === '') errors.nombre = 'Ingresa el nombre.'
  if (apellido.trim() === '') errors.apellido = 'Ingresa el apellido.'
  if (errors.nombre === undefined && errors.apellido === undefined
    && Array.from(joinFullName(nombre.trim(), apellido.trim())).length > MAX_FULL_NAME) {
    errors.apellido = `El nombre completo admite hasta ${String(MAX_FULL_NAME)} caracteres.`
  }
  return errors
}

/** Separa un nombre completo existente: la primera palabra es el nombre, el resto el apellido. */
function splitFullName(full: string): { nombre: string; apellido: string } {
  const [nombre = '', ...rest] = full.trim().split(/\s+/)
  return { nombre, apellido: rest.join(' ') }
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'
const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'

// ─── Piezas compartidas ─────────────────────────────────────────────────────

interface DialogProps {
  labelId: string
  role?: 'dialog' | 'alertdialog'
  wide?: boolean
  /** Diálogo encima de otro: no toca el scroll del body. */
  nested?: boolean
  /** Mientras hay un diálogo encima, este no atiende teclas ni atrapa el foco. */
  suspended?: boolean
  onClose: () => void
  children: ReactNode
}

/** Diálogo accesible: Escape cierra, Tab no sale del diálogo y el foco vuelve al disparador. */
function Dialog({ labelId, role = 'dialog', wide = true, nested = false, suspended = false, onClose, children }: DialogProps) {
  // Se captura al montar, cuando el disparador aún tiene el foco.
  const [opener] = useState<HTMLElement | null>(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  const suspendedRef = useRef(suspended)
  useEffect(() => {
    closeRef.current = onClose
    suspendedRef.current = suspended
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (suspendedRef.current) return
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      const panel = panelRef.current
      if (e.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector))
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      const outside = !panel.contains(document.activeElement)
      if (e.shiftKey && (outside || document.activeElement === first)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (outside || document.activeElement === last)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    if (!nested) document.body.classList.add('overflow-hidden')
    return () => {
      document.removeEventListener('keydown', onKey)
      if (!nested) document.body.classList.remove('overflow-hidden')
      opener?.focus()
    }
  }, [opener, nested])

  return (
    <div
      aria-labelledby={labelId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      ref={panelRef}
      role={role}
    >
      <div aria-hidden="true" className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm" onClick={() => { closeRef.current() }} />
      <div
        className={`relative w-full ${wide ? 'max-w-xl' : 'max-w-md'} overscroll-contain bg-surface-container-lowest rounded-2xl shadow-[0_20px_50px_rgba(6,31,35,0.25)] border border-surface-container overflow-hidden z-10`}
      >
        {children}
      </div>
    </div>
  )
}

/** Tras un envío con errores, lleva el foco al primer campo inválido. */
function useFocusFirstInvalid(formRef: { current: HTMLFormElement | null }, attempts: number) {
  useEffect(() => {
    if (attempts === 0) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [attempts, formRef])
}

interface DialogHeaderProps {
  titleId: string
  title: string
  subtitle: string
  onClose: () => void
}

function DialogHeader({ titleId, title, subtitle, onClose }: DialogHeaderProps) {
  return (
    <>
      <div className="px-space-lg pt-space-lg pb-4 flex items-start justify-between gap-3 border-b border-surface-container-low">
        <div className="min-w-0">
          <h2 className="font-headline-md text-on-surface font-bold leading-tight text-balance" id={titleId}>{title}</h2>
          <p className="font-body-sm text-on-surface-variant text-pretty">{subtitle}</p>
        </div>
        <button
          aria-label="Cerrar modal"
          className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer touch-manipulation ${focusRing}`}
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
  /** Control junto al campo, p. ej. el botón de mostrar contraseña. */
  trailing?: ReactNode
}

function TextField({ label, error, trailing, ...input }: TextFieldProps) {
  const id = useId()
  const errorId = useId()
  return (
    <div className="flex flex-col gap-1">
      <label className={fieldLabelClass} htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className={`${inputClass} ${trailing ? 'pr-10' : ''}`}
          id={id}
          {...input}
        />
        {trailing}
      </div>
      {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
    </div>
  )
}

function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      aria-pressed={visible}
      className={`absolute inset-y-0 right-0 flex items-center px-3 rounded-r-lg text-outline hover:text-on-surface transition-colors touch-manipulation ${focusRing}`}
      onClick={onToggle}
      type="button"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-lg">{visible ? 'visibility_off' : 'visibility'}</span>
    </button>
  )
}

const shortRuleLabels: Record<PasswordRuleId, string> = {
  length: 'mínimo 8 caracteres',
  upper: 'mayúscula',
  lower: 'minúscula',
  digit: 'número',
  special: 'carácter especial',
  noSpaces: 'sin espacios',
  maxBytes: '',
}

/** Barra fina que pasa de rojo a verde; el anuncio breve es solo para lectores de pantalla. */
function PasswordStrength({ password }: { password: string }) {
  const rules = evaluatePasswordRules(password).filter((rule) => rule.id !== 'maxBytes')
  // Un campo vacío no cuenta como cumplido: la barra empieza siempre en cero.
  const met = password === '' ? [] : rules.filter((rule) => rule.met)
  const complete = met.length === rules.length
  const percent = rules.length === 0 ? 0 : (met.length / rules.length) * 100
  const announcement = met.length === 0 ? '' : `Cumplidos: ${met.map((rule) => shortRuleLabels[rule.id]).join(', ')}.`
  return (
    <div className="flex flex-col gap-1">
      <div aria-hidden="true" className="h-1 w-full rounded-full bg-surface-container-high overflow-hidden">
        <div
          className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300 ${complete ? 'bg-secondary' : 'bg-error'}`}
          data-testid="password-strength-fill"
          style={{ width: `${String(percent)}%` }}
        />
      </div>
      <p aria-live="polite" className="sr-only" data-testid="password-rules-live">{announcement}</p>
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
            <div className="p-3 rounded-xl bg-surface-container-low border border-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-2 peer-focus-visible:ring-secondary text-on-surface transition-[background-color,border-color] flex flex-col items-center text-center gap-1.5 hover:bg-surface-container shadow-xs">
              <span aria-hidden="true" className="material-symbols-outlined text-2xl">{roleIcons[r]}</span>
              <span className="font-label-badge uppercase font-bold">{roleLabels[r]}</span>
            </div>
          </label>
        ))}
      </div>
      <div className="bg-surface-container p-3 rounded-xl flex flex-col">
        <span className="font-body-sm font-bold text-primary">{roleDescriptions[value].title}</span>
        <span className="font-body-sm text-on-surface-variant">{roleDescriptions[value].description}</span>
      </div>
    </fieldset>
  )
}

const footerButtonClass =
  `px-space-md py-2.5 rounded-xl font-body-md font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer touch-manipulation ${focusRing}`
const destructiveButtonClass =
  `px-space-lg py-2.5 rounded-xl bg-error-container text-on-error-container font-body-md font-bold cursor-pointer touch-manipulation disabled:opacity-50 ${focusRing}`
const primaryButtonClass =
  `flex items-center gap-2 bg-primary hover:bg-on-primary-fixed-variant text-on-primary px-space-lg py-2.5 rounded-xl shadow-md hover:shadow-lg transition-[background-color,box-shadow] motion-safe:active:scale-95 font-body-md font-bold cursor-pointer touch-manipulation disabled:opacity-50 ${focusRing}`

/** Confirmación al cerrar un formulario con cambios sin guardar. */
function DiscardChangesDialog({ onKeep, onDiscard }: { onKeep: () => void; onDiscard: () => void }) {
  const titleId = useId()
  return (
    <Dialog labelId={titleId} nested onClose={onKeep} role="alertdialog" wide={false}>
      <div className="p-space-lg flex flex-col gap-4">
        <h2 className="font-headline-md text-on-surface font-bold leading-tight" id={titleId}>¿Descartar cambios?</h2>
        <p className="font-body-sm text-on-surface-variant">Los datos escritos en este formulario se perderán.</p>
        <div className="flex items-center justify-between gap-3 pt-2">
          <button autoFocus className={footerButtonClass} onClick={onKeep} type="button">Seguir editando</button>
          <button className={destructiveButtonClass} onClick={onDiscard} type="button">Descartar</button>
        </div>
      </div>
    </Dialog>
  )
}

// ─── Crear ──────────────────────────────────────────────────────────────────

/** Campos del formulario de creación; el nombre completo se compone al enviar. */
type CreateForm = Omit<NewUser, 'fullName'>
const emptyUser: CreateForm = { email: '', password: '', role: 'OPERATOR' }

export interface CreateUserModalProps {
  onClose: () => void
  onSaved: (message: string) => void
}

export function CreateUserModal({ onClose, onSaved }: CreateUserModalProps) {
  const titleId = useId()
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [form, setForm] = useState<CreateForm>(emptyUser)
  const [submitted, setSubmitted] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const isDirty = nombre.trim() !== '' || apellido.trim() !== '' || form.email.trim() !== '' || form.password !== '' || form.role !== emptyUser.role
  const requestClose = () => {
    if (isDirty) setConfirmDiscard(true)
    else onClose()
  }

  const nameErr = nameErrors(nombre, apellido)
  const errors = {
    nombre: nameErr.nombre,
    apellido: nameErr.apellido,
    email: form.email.trim() === '' ? 'Ingresa el correo del usuario.' : validateEmail(form.email),
    password: missingPasswordRulesMessage(form.password),
  }
  const hasErrors = Object.values(errors).some((message) => message !== undefined)

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: usersKey })
      onSaved(`Usuario ${created.fullName} creado.`)
      onClose()
    },
  })

  useFocusFirstInvalid(formRef, attempts)

  const update = <K extends keyof CreateForm>(key: K, value: CreateForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
    setAttempts((n) => n + 1)
    if (hasErrors) return
    mutation.mutate({ ...form, email: form.email.trim(), fullName: joinFullName(nombre.trim(), apellido.trim()) })
  }

  return (
    <>
    <Dialog labelId={titleId} onClose={requestClose} suspended={confirmDiscard}>
      <DialogHeader
        onClose={requestClose}
        subtitle="Configura las credenciales de acceso y el rol en la red Pikka."
        title="Crear Nuevo Usuario"
        titleId={titleId}
      />
      <form className="p-space-lg flex flex-col gap-4 max-h-[calc(85vh-140px)] overflow-y-auto overscroll-contain" noValidate onSubmit={onSubmit} ref={formRef}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            autoComplete="given-name"
            autoFocus
            error={submitted ? errors.nombre : undefined}
            label="Nombre"
            name="givenName"
            onChange={(e) => { setNombre(e.target.value) }}
            placeholder="Ej. Ana…"
            value={nombre}
          />
          <TextField
            autoComplete="family-name"
            error={submitted ? errors.apellido : undefined}
            label="Apellido"
            name="familyName"
            onChange={(e) => { setApellido(e.target.value) }}
            placeholder="Ej. Pérez…"
            value={apellido}
          />
        </div>
        <TextField
          autoComplete="off"
          error={submitted ? errors.email : undefined}
          label="Correo"
          name="email"
          onChange={(e) => { update('email', e.target.value) }}
          placeholder="Ej. nombre@dominio.com…"
          spellCheck={false}
          type="email"
          value={form.email}
        />
        <TextField
          autoComplete="new-password"
          error={submitted ? errors.password : undefined}
          label="Contraseña provisional"
          name="password"
          onChange={(e) => { update('password', e.target.value) }}
          placeholder="Mínimo 8 caracteres…"
          trailing={<PasswordToggle onToggle={() => { setShowPassword((v) => !v) }} visible={showPassword} />}
          type={showPassword ? 'text' : 'password'}
          value={form.password}
        />
        <PasswordStrength password={form.password} />
        <p className="font-body-sm text-on-surface-variant">El usuario deberá renovar su contraseña en el primer inicio de sesión.</p>
        <RoleRadios onChange={(role) => { update('role', role) }} value={form.role} />

        {mutation.isError && <ErrorMessage>{userMessage(mutation.error)}</ErrorMessage>}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-surface-container-low mt-2">
          <button className={footerButtonClass} onClick={requestClose} type="button">Cancelar</button>
          <button className={primaryButtonClass} disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Creando…' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Dialog>
    {confirmDiscard && <DiscardChangesDialog onDiscard={onClose} onKeep={() => { setConfirmDiscard(false) }} />}
    </>
  )
}

// ─── Editar ─────────────────────────────────────────────────────────────────

export interface EditUserModalProps {
  user: User
  onClose: () => void
  onSaved: (message: string) => void
}

export function EditUserModal({ user, onClose, onSaved }: EditUserModalProps) {
  const titleId = useId()
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const roleLocked = user.role === 'CUSTOMER'
  const initialNames = splitFullName(user.fullName)
  const [nombre, setNombre] = useState(initialNames.nombre)
  const [apellido, setApellido] = useState(initialNames.apellido)
  const [role, setRole] = useState<Role>(user.role)
  const [submitted, setSubmitted] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const nameErr = nameErrors(nombre, apellido)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const isDirty = nombre !== initialNames.nombre || apellido !== initialNames.apellido || (!roleLocked && role !== user.role)
  const requestClose = () => {
    if (isDirty) setConfirmDiscard(true)
    else onClose()
  }

  const mutation = useMutation({
    mutationFn: (changes: UserChanges) => updateUser(user.id, changes),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: usersKey })
      onSaved(`Usuario ${saved.fullName} actualizado.`)
      onClose()
    },
  })

  useFocusFirstInvalid(formRef, attempts)

  const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
    setAttempts((n) => n + 1)
    if (nameErr.nombre !== undefined || nameErr.apellido !== undefined) return
    const changes: UserChanges = {}
    const name = joinFullName(nombre.trim(), apellido.trim())
    if (name !== user.fullName) changes.fullName = name
    // Los clientes no cambian de rol aquí: el backend solo asigna ADMIN, OPERATOR y DRIVER.
    if (!roleLocked && role !== user.role) changes.role = role
    if (changes.fullName === undefined && changes.role === undefined) {
      onClose()
      return
    }
    mutation.mutate(changes)
  }

  return (
    <>
    <Dialog labelId={titleId} onClose={requestClose} suspended={confirmDiscard}>
      <DialogHeader
        onClose={requestClose}
        subtitle="Cambia el nombre o el rol. El correo no se puede modificar."
        title="Editar Usuario"
        titleId={titleId}
      />
      <form className="p-space-lg flex flex-col gap-4 max-h-[calc(85vh-140px)] overflow-y-auto overscroll-contain" noValidate onSubmit={onSubmit} ref={formRef}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            autoComplete="given-name"
            autoFocus
            error={submitted ? nameErr.nombre : undefined}
            label="Nombre"
            name="givenName"
            onChange={(e) => { setNombre(e.target.value) }}
            value={nombre}
          />
          <TextField
            autoComplete="family-name"
            error={submitted ? nameErr.apellido : undefined}
            label="Apellido"
            name="familyName"
            onChange={(e) => { setApellido(e.target.value) }}
            value={apellido}
          />
        </div>
        <TextField autoComplete="off" label="Correo" readOnly spellCheck={false} value={user.email} />
        {roleLocked ? (
          <p className="font-body-sm text-on-surface-variant">
            Rol: <span className="font-bold text-on-surface">{roleLabels[user.role]}</span>. Los clientes no cambian de rol desde esta pantalla.
          </p>
        ) : (
          <RoleRadios onChange={setRole} value={role} />
        )}

        {mutation.isError && <ErrorMessage>{userMessage(mutation.error)}</ErrorMessage>}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-surface-container-low mt-2">
          <button className={footerButtonClass} onClick={requestClose} type="button">Cancelar</button>
          <button className={primaryButtonClass} disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Dialog>
    {confirmDiscard && <DiscardChangesDialog onDiscard={onClose} onKeep={() => { setConfirmDiscard(false) }} />}
    </>
  )
}

// ─── Desactivar ─────────────────────────────────────────────────────────────

export interface DeactivateUserDialogProps {
  user: User
  onClose: () => void
  onSaved: (message: string) => void
}

export function DeactivateUserDialog({ user, onClose, onSaved }: DeactivateUserDialogProps) {
  const titleId = useId()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deactivateUser(user.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersKey })
      onSaved(`Usuario ${user.fullName} desactivado.`)
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

        <div className="flex items-center justify-between gap-3 pt-2">
          <button autoFocus className={footerButtonClass} onClick={onClose} type="button">Cancelar</button>
          <button
            className={destructiveButtonClass}
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
