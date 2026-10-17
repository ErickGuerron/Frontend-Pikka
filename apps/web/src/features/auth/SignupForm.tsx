import { useRef, useState, type SyntheticEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail, MapPin, Phone, User } from 'lucide-react'
import { userMessage } from '@/shared/api/errors'
import { CITY_MAX, normalizePhone, sanitizeNameInput, sanitizePhoneInput } from '@/shared/validation/contact'
import { useSignup } from './hooks'
import {
  evaluatePasswordRules,
  joinFullName,
  MAX_NAME_PART,
  passwordMeetsPolicy,
  validateSignup,
  type PasswordRuleId,
  type SignupErrors,
  type SignupValues,
} from './signup-validation'

const labelClasses = 'auth-label'

const FIELD_ORDER = ['nombre', 'apellido', 'city', 'phone', 'email', 'password', 'confirm'] as const

export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const signup = useSignup()
  const [values, setValues] = useState<SignupValues>({ nombre: '', apellido: '', city: '', phone: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<SignupErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const set = (key: keyof SignupValues) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validateSignup(values)
    setErrors(found)
    const firstInvalid = FIELD_ORDER.find((key) => found[key] !== undefined)
    if (firstInvalid) {
      // Focusing the first invalid field also scrolls it into view.
      formRef.current?.querySelector<HTMLInputElement>(`#signup-${firstInvalid}`)?.focus()
      return
    }
    signup.mutate(
      {
        fullName: joinFullName(values.nombre, values.apellido),
        email: values.email.trim(),
        password: values.password,
        phone: normalizePhone(values.phone.trim()),
        city: values.city.trim(),
      },
      { onSuccess },
    )
  }

  const isLoading = signup.isPending
  const passwordType = showPassword ? 'text' : 'password'

  return (
    <form ref={formRef} className="space-y-3" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="signup-nombre"
          label="Nombre"
          icon={<User className="auth-icon" />}
          value={values.nombre}
          onChange={(value) => { set('nombre')(sanitizeNameInput(value)) }}
          error={errors.nombre}
          disabled={isLoading}
          autoComplete="given-name"
          maxLength={MAX_NAME_PART}
          placeholder="Carla"
        />
        <Input
          id="signup-apellido"
          label="Apellido"
          icon={<User className="auth-icon" />}
          value={values.apellido}
          onChange={(value) => { set('apellido')(sanitizeNameInput(value)) }}
          error={errors.apellido}
          disabled={isLoading}
          autoComplete="family-name"
          maxLength={MAX_NAME_PART}
          placeholder="Cliente"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="signup-city"
          label="Ciudad"
          icon={<MapPin className="auth-icon" />}
          value={values.city}
          onChange={set('city')}
          error={errors.city}
          disabled={isLoading}
          autoComplete="address-level2"
          maxLength={CITY_MAX}
          placeholder="Quito"
        />
        <Input
          id="signup-phone"
          label="Teléfono"
          type="tel"
          icon={<Phone className="auth-icon" />}
          value={values.phone}
          onChange={(value) => { set('phone')(sanitizePhoneInput(value)) }}
          error={errors.phone}
          disabled={isLoading}
          autoComplete="tel"
          maxLength={10}
          placeholder="0991234567"
        />
      </div>
      <Input
        id="signup-email"
        label="Correo electrónico"
        type="email"
        icon={<Mail className="auth-icon" />}
        value={values.email}
        onChange={set('email')}
        error={errors.email}
        disabled={isLoading}
        autoComplete="email"
        maxLength={254}
        placeholder="tucorreo@ejemplo.com"
      />
      <Input
        id="signup-password"
        label="Contraseña"
        type={passwordType}
        icon={<Lock className="auth-icon" />}
        value={values.password}
        onChange={set('password')}
        error={errors.password}
        disabled={isLoading}
        autoComplete="new-password"
        trailing={
          <button
            type="button"
            onClick={() => { setShowPassword(!showPassword) }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center auth-muted hover:opacity-70 transition-colors"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        }
      />
      <PasswordStrength password={values.password} />
      <Input
        id="signup-confirm"
        label="Confirmar contraseña"
        type={passwordType}
        icon={<Lock className="auth-icon" />}
        value={values.confirm}
        onChange={set('confirm')}
        error={errors.confirm}
        disabled={isLoading}
        autoComplete="new-password"
      />

      {signup.isError && (
        <div role="alert" className="auth-alert">
          {userMessage(signup.error)}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="auth-submit group"
      >
        <span>{isLoading ? 'Creando cuenta…' : 'Crear cuenta'}</span>
        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
      </button>
    </form>
  )
}

interface InputProps {
  id: string
  label: string
  icon: React.ReactNode
  value: string
  onChange: (value: string) => void
  error: string | undefined
  disabled: boolean
  autoComplete: string
  type?: string
  maxLength?: number
  placeholder?: string
  trailing?: React.ReactNode
}

function Input({ id, label, icon, value, onChange, error, disabled, autoComplete, type = 'text', placeholder, trailing, maxLength }: InputProps) {
  const errorId = `${id}-error`
  return (
    <div className="space-y-1">
      <label className={labelClasses} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 lg:pl-3 flex items-center pointer-events-none">{icon}</div>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => { onChange(e.target.value) }}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={error !== undefined}
          aria-describedby={error !== undefined ? errorId : undefined}
          className={`auth-input `.trim()}
        />
        {trailing}
      </div>
      {error !== undefined && (
        <p id={errorId} role="alert" className="auth-error">
          {error}
        </p>
      )}
    </div>
  )
}

type StrengthLevel = 'weak' | 'medium' | 'strong'

const STRENGTH: Record<StrengthLevel, { label: string; bar: string; text: string }> = {
  weak: { label: 'Débil', bar: 'bg-red-500', text: 'text-red-600 lg:text-red-400' },
  medium: { label: 'Media', bar: 'bg-amber-500', text: 'text-amber-600 lg:text-amber-400' },
  strong: { label: 'Segura', bar: 'bg-emerald-500', text: 'text-emerald-700 lg:text-emerald-300' },
}

const CONTENT_RULE_IDS: readonly PasswordRuleId[] = ['length', 'upper', 'lower', 'digit', 'special']

/** Segmented bar, one segment per content rule; green only when all pass and the full policy holds. */
function PasswordStrength({ password }: { password: string }) {
  const rules = evaluatePasswordRules(password).filter((rule) => CONTENT_RULE_IDS.includes(rule.id))
  const met = rules.filter((rule) => rule.met).length
  const level: StrengthLevel =
    met === rules.length ? (passwordMeetsPolicy(password) ? 'strong' : 'medium') : met >= 3 ? 'medium' : 'weak'
  const { label, bar, text } = STRENGTH[level]
  return (
    <div
      role="progressbar"
      aria-label="Seguridad de la contraseña"
      aria-valuemin={0}
      aria-valuemax={rules.length}
      aria-valuenow={met}
      aria-valuetext={label}
      data-level={level}
      className="space-y-1"
    >
      <div className="flex gap-1" aria-hidden="true">
        {rules.map((rule, index) => (
          <span
            key={rule.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${index < met ? bar : 'bg-slate-300/70 lg:bg-white/15'}`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-semibold ${text}`}>{label}</p>
    </div>
  )
}
