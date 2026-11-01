import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode, type SyntheticEvent } from 'react'
import { Link } from 'react-router'
import { ApiError, userMessage } from '@/shared/api/errors'
import { normalizePhone, sanitizePhoneInput } from '@/shared/validation/contact'
import { createDriver, type NewDriver } from './api'
import { vehicleTypeLabels, vehicleTypes, type VehicleType } from './types'
import {
  latestBirthDate,
  MAX_NAME,
  normalizeIdentifier,
  normalizePlate,
  validateDriverForm,
  type DriverFormErrors,
  type DriverFormValues,
} from './validation'

const empty: DriverFormValues = {
  firstName: '',
  lastName: '',
  birthDate: '',
  phone: '',
  city: '',
  vehicleType: '',
  identifier: '',
  plate: '',
  email: '',
  password: '',
}

const inputClass =
  'px-3.5 py-2 rounded-lg border border-[#cce7ea] text-xs font-sans text-[#061f23] bg-white focus:outline-none focus:border-[#004b4e] focus:ring-1 focus:ring-[#004b4e] transition-all aria-[invalid=true]:border-[#ba1a1a]'

const conflictMessage =
  'Correo, documento o placa ya registrados. Si el correo ya se usó en un intento fallido, prueba con otro correo: queda reservado aunque el alta no se haya completado.'

function failureMessage(error: unknown): string {
  return error instanceof ApiError && error.status === 409 ? conflictMessage : userMessage(error)
}

function toRequest(values: DriverFormValues): NewDriver {
  return {
    email: values.email.trim(),
    password: values.password,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    birthDate: values.birthDate,
    phone: normalizePhone(values.phone.trim()),
    // validateDriverForm ya comprobó que es uno de los tres tipos.
    vehicleType: values.vehicleType as VehicleType,
    identifier: normalizeIdentifier(values.identifier),
    plate: normalizePlate(values.plate),
    city: values.city.trim(),
  }
}

function Field({ id, label, error, children }: { id: string; label: string; error: string | undefined; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-wider text-[#557b7f] font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="font-mono text-[11px] text-[#ba1a1a]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Alta de repartidor (solo ADMIN): crea el usuario DRIVER y su perfil en una sola operación. */
export function CreateDriverPage() {
  const [form, setForm] = useState<DriverFormValues>(empty)
  const [submitted, setSubmitted] = useState(false)
  const queryClient = useQueryClient()
  const today = new Date()
  const errors: DriverFormErrors = submitted ? validateDriverForm(form, today) : {}

  const mutation = useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      setForm(empty)
      setSubmitted(false)
      void queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
  })

  const set = <K extends keyof DriverFormValues>(key: K, value: DriverFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const bind = (key: keyof DriverFormValues) => ({
    id: key,
    value: form[key],
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
  })

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (mutation.isPending) return
    setSubmitted(true)
    if (Object.keys(validateDriverForm(form, new Date())).length > 0) return
    mutation.mutate(toRequest(form))
  }

  return (
    <div className="max-w-2xl">
      <section className="bg-white rounded-xl border border-[#cce7ea] p-6 shadow-sm">
        <div className="border-b border-[#cce7ea] pb-4 mb-5 space-y-1">
          <div className="inline-flex items-center gap-2 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
            <span className="font-semibold">DOSSIER FLOTA · ALTA DE REPARTIDOR</span>
          </div>
          <h1 className="text-xl font-bold text-[#004b4e] font-sans">Nuevo repartidor</h1>
          <p className="text-xs font-mono text-[#557b7f]">
            Registra la cuenta de acceso y el perfil del repartidor. Nace activo y disponible.
          </p>
        </div>

        <form className="flex flex-col gap-6" noValidate onSubmit={onSubmit}>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#004b4e]">Datos personales</legend>
            <Field id="firstName" label="Nombre" error={errors.firstName}>
              <input {...bind('firstName')} autoComplete="given-name" className={inputClass} maxLength={MAX_NAME} onChange={(e) => { set('firstName', e.target.value) }} />
            </Field>
            <Field id="lastName" label="Apellido" error={errors.lastName}>
              <input {...bind('lastName')} autoComplete="family-name" className={inputClass} maxLength={MAX_NAME} onChange={(e) => { set('lastName', e.target.value) }} />
            </Field>
            <Field id="birthDate" label="Fecha de nacimiento" error={errors.birthDate}>
              <input {...bind('birthDate')} className={inputClass} max={latestBirthDate(today)} type="date" onChange={(e) => { set('birthDate', e.target.value) }} />
            </Field>
            <Field id="identifier" label="Documento de identidad" error={errors.identifier}>
              <input {...bind('identifier')} autoComplete="off" className={inputClass} maxLength={24} onChange={(e) => { set('identifier', e.target.value) }} />
            </Field>
            <Field id="phone" label="Teléfono de contacto" error={errors.phone}>
              <input {...bind('phone')} autoComplete="tel" className={inputClass} inputMode="tel" type="tel" onChange={(e) => { set('phone', sanitizePhoneInput(e.target.value)) }} />
            </Field>
            <Field id="city" label="Ciudad" error={errors.city}>
              <input {...bind('city')} autoComplete="address-level2" className={inputClass} maxLength={80} onChange={(e) => { set('city', e.target.value) }} />
            </Field>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#004b4e]">Vehículo</legend>
            <Field id="vehicleType" label="Tipo de vehículo" error={errors.vehicleType}>
              <select {...bind('vehicleType')} className={inputClass} onChange={(e) => { set('vehicleType', e.target.value) }}>
                <option value="">Elige un tipo</option>
                {vehicleTypes.map((type) => (
                  <option key={type} value={type}>{vehicleTypeLabels[type]}</option>
                ))}
              </select>
            </Field>
            <Field id="plate" label="Placa" error={errors.plate}>
              <input {...bind('plate')} autoCapitalize="characters" autoComplete="off" className={inputClass} maxLength={10} onChange={(e) => { set('plate', e.target.value) }} />
            </Field>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#004b4e]">Cuenta de acceso</legend>
            <Field id="email" label="Correo" error={errors.email}>
              <input {...bind('email')} autoComplete="off" className={inputClass} type="email" onChange={(e) => { set('email', e.target.value) }} />
            </Field>
            <Field id="password" label="Contraseña inicial" error={errors.password}>
              <input {...bind('password')} autoComplete="new-password" className={inputClass} type="password" onChange={(e) => { set('password', e.target.value) }} />
            </Field>
          </fieldset>

          {mutation.isError ? (
            <div role="alert" className="p-3 rounded-lg bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] font-mono text-xs">
              {failureMessage(mutation.error)}
            </div>
          ) : null}
          {mutation.isSuccess ? (
            <div role="status" className="p-3 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-mono text-xs font-semibold">
              Repartidor {mutation.data.fullName} creado. Ya puede iniciar sesión con {mutation.data.email}.
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors border border-[#004b4e] shadow-sm"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creando…' : 'Crear repartidor'}
            </button>
            <Link className="font-mono text-xs font-semibold text-[#004b4e] underline" to="/drivers">
              Volver a repartidores
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
