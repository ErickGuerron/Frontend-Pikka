import type { ReactNode } from 'react'
import { Field, inputClass } from '@/shared/ui/form'
import {
  LIMITS,
  settingsFormIssues,
  type SettingsForm,
  weekdayCodes,
  weekdayLabels,
  zonePriorities,
  zonePriorityLabels,
  type WeekdayCode,
  type ZonePriority,
} from './settings'

export interface ZoneSettingsFormProps {
  value: SettingsForm
  onChange: (next: SettingsForm) => void
}

/** Marca de obligatorio en la etiqueta. */
const REQUIRED = ' *'

/**
 * Configuración operativa de la zona (solo ADMIN): depósito y capacidad, ventanas y cortes, prioridad y cupo.
 * Cada campo muestra un ejemplo, sus límites y, si el valor no sirve, el motivo. Las reglas son las del backend.
 */
export function ZoneSettingsForm({ value, onChange }: ZoneSettingsFormProps) {
  const set = <K extends keyof SettingsForm>(key: K, next: SettingsForm[K]) => { onChange({ ...value, [key]: next }) }
  const toggleDay = (day: WeekdayCode) => {
    const days = value.serviceDays.includes(day)
      ? value.serviceDays.filter((d) => d !== day)
      : weekdayCodes.filter((d) => d === day || value.serviceDays.includes(d))
    set('serviceDays', days)
  }
  const issues = settingsFormIssues(value)
  const issueOf = (field: keyof SettingsForm) => issues.find((i) => i.field === field)?.message ?? null

  const invalid = (field: keyof SettingsForm, raw: string) => (issueOf(field) !== null && raw.trim() !== '' ? true : undefined)

  return (
    <div className="flex flex-col gap-3">
      <Card icon="warehouse" title="Depósito y capacidad de ruta" tone="amber">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Field label={`Bodega / almacén de salida${REQUIRED}`}>
            <input
              aria-invalid={invalid('depotName', value.depotName)}
              autoComplete="off"
              className={inputClass}
              maxLength={LIMITS.depotNameMax}
              onChange={(e) => { set('depotName', e.target.value); }}
              placeholder="Ej. Hub Norte"
              value={value.depotName}
            />
            <Hint error={issueOf("depotName")} raw={value.depotName} required>{`Solo letras, ${String(LIMITS.depotNameMin)} a ${String(LIMITS.depotNameMax)} caracteres`}</Hint>
          </Field>
          <Field label="Descripción de cobertura">
            <input
              className={inputClass}
              maxLength={LIMITS.maxDescription}
              onChange={(e) => { set('description', e.target.value); }}
              placeholder="Ej. Zona comercial con alta densidad residencial"
              value={value.description}
            />
            <Hint error={issueOf("description")} raw={value.description}>{`Opcional · máximo ${String(LIMITS.maxDescription)} caracteres`}</Hint>
          </Field>
          <Field label={`Latitud de la bodega${REQUIRED}`}>
            <input
              aria-invalid={invalid('depotLatitude', value.depotLatitude)}
              className={`${inputClass} font-mono`}
              inputMode="decimal"
              onChange={(e) => { set('depotLatitude', e.target.value); }}
              placeholder="Ej. -0.179000"
              value={value.depotLatitude}
            />
            <Hint error={issueOf("depotLatitude")} raw={value.depotLatitude} required>{`Ecuador: entre ${String(LIMITS.latitude.min)} y ${String(LIMITS.latitude.max)}`}</Hint>
          </Field>
          <Field label={`Longitud de la bodega${REQUIRED}`}>
            <input
              aria-invalid={invalid('depotLongitude', value.depotLongitude)}
              className={`${inputClass} font-mono`}
              inputMode="decimal"
              onChange={(e) => { set('depotLongitude', e.target.value); }}
              placeholder="Ej. -78.483000"
              value={value.depotLongitude}
            />
            <Hint error={issueOf("depotLongitude")} raw={value.depotLongitude} required>{`Ecuador: entre ${String(LIMITS.longitude.min)} y ${String(LIMITS.longitude.max)}`}</Hint>
          </Field>
          <Field label={`Máx. pedidos por ruta${REQUIRED}`}>
            <input
              aria-invalid={invalid('maxOrdersPerRoute', value.maxOrdersPerRoute)}
              className={`${inputClass} font-mono`}
              inputMode="numeric"
              onChange={(e) => { set('maxOrdersPerRoute', e.target.value.replace(/\D/g, '')); }}
              placeholder="Ej. 18"
              value={value.maxOrdersPerRoute}
            />
            <Hint error={issueOf("maxOrdersPerRoute")} raw={value.maxOrdersPerRoute} required>{`Entero de 1 a ${String(LIMITS.maxOrdersPerRoute)} pedidos`}</Hint>
          </Field>
          <Field label={`Capacidad por ruta (kg)${REQUIRED}`}>
            <input
              aria-invalid={invalid('routeCapacityKg', value.routeCapacityKg)}
              className={`${inputClass} font-mono`}
              inputMode="decimal"
              onChange={(e) => { set('routeCapacityKg', e.target.value.replace(/[^\d.]/g, '')); }}
              placeholder="Ej. 45"
              value={value.routeCapacityKg}
            />
            <Hint error={issueOf("routeCapacityKg")} raw={value.routeCapacityKg} required>{`De 1 a ${String(LIMITS.maxRouteCapacityKg)} kg`}</Hint>
          </Field>
        </div>
      </Card>

      <Card icon="schedule" title="Ventanas y tiempos de corte" aside={<span className="font-mono text-[10px] text-on-surface-variant">{value.timezone}</span>}>
        <div>
          <span className="mb-1.5 block text-[11px] font-semibold text-on-surface-variant">Días de servicio{REQUIRED}</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Días de servicio">
            {weekdayCodes.map((day) => {
              const active = value.serviceDays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={active}
                  onClick={() => { toggleDay(day); }}
                  className={`h-8 w-10 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                    active ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {weekdayLabels[day]}
                </button>
              )
            })}
          </div>
          <span className="mt-1 block text-[10px] text-on-surface-variant">
            {issueOf('serviceDays') !== null ? issueOf('serviceDays') : 'Obligatorio · al menos un día'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Inicio ventana${REQUIRED}`}>
            <input className={`${inputClass} font-mono`} type="time" onChange={(e) => { set('deliveryWindowFrom', e.target.value); }} value={value.deliveryWindowFrom} />
            <Hint error={issueOf("deliveryWindowFrom")} raw={value.deliveryWindowFrom} required>Hora local de inicio</Hint>
          </Field>
          <Field label={`Fin ventana${REQUIRED}`}>
            <input className={`${inputClass} font-mono`} type="time" onChange={(e) => { set('deliveryWindowTo', e.target.value); }} value={value.deliveryWindowTo} />
            <Hint error={issueOf("deliveryWindowTo")} raw={value.deliveryWindowTo} required>Debe ser posterior al inicio</Hint>
          </Field>
          <Field label={`Hora de corte${REQUIRED}`}>
            <input className={`${inputClass} font-mono`} type="time" onChange={(e) => { set('cutoffTime', e.target.value); }} value={value.cutoffTime} />
            <Hint error={issueOf("cutoffTime")} raw={value.cutoffTime} required>Hasta aquí entran pedidos del día</Hint>
          </Field>
          <Field label={`Hora de despacho${REQUIRED}`}>
            <input className={`${inputClass} font-mono`} type="time" onChange={(e) => { set('dispatchTime', e.target.value); }} value={value.dispatchTime} />
            <Hint error={issueOf("dispatchTime")} raw={value.dispatchTime} required>Hora de salida de los repartidores</Hint>
          </Field>
        </div>
      </Card>

      <Card icon="monitoring" title="Prioridad y cupo diario">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Field label={`Prioridad${REQUIRED}`}>
            <select
              className={inputClass}
              onChange={(e) => { set('priority', e.target.value as ZonePriority); }}
              value={value.priority}
            >
              {zonePriorities.map((p) => (
                <option key={p} value={p}>{zonePriorityLabels[p]}</option>
              ))}
            </select>
            <span className="text-[10px] text-on-surface-variant">Orden de despacho frente a otras zonas</span>
          </Field>
          <Field label={`Límite diario (pedidos/día)${REQUIRED}`}>
            <input
              aria-invalid={invalid('dailyOrderLimit', value.dailyOrderLimit)}
              className={`${inputClass} font-mono`}
              inputMode="numeric"
              onChange={(e) => { set('dailyOrderLimit', e.target.value.replace(/\D/g, '')); }}
              placeholder="Ej. 250"
              value={value.dailyOrderLimit}
            />
            <Hint error={issueOf("dailyOrderLimit")} raw={value.dailyOrderLimit} required>{`Entero de 1 a ${String(LIMITS.maxDailyOrderLimit)} pedidos por día`}</Hint>
          </Field>
        </div>
      </Card>
    </div>
  )
}

function Card({ icon, title, aside, tone, children }: { icon: string; title: string; aside?: ReactNode; tone?: 'amber'; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-surface-container-high/70 bg-surface-container-lowest p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-surface-container-high pb-2">
        <h3 className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${tone === 'amber' ? 'text-amber-800' : 'text-on-surface'}`}>
          <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${tone === 'amber' ? 'text-amber-700' : 'text-primary'}`}>{icon}</span>
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Pista bajo un campo: el error si el valor escrito no sirve; "Obligatorio" si falta; si no, el límite. */
function Hint({ error, raw, required = false, children }: { error: string | null; raw: string; required?: boolean; children: string }) {
  if (error !== null && raw.trim() !== '') return <span role="alert" className="text-[10px] font-medium text-error">{error}</span>
  if (required && raw.trim() === '') return <span className="text-[10px] text-on-surface-variant">Obligatorio · {children}</span>
  return <span className="text-[10px] text-on-surface-variant">{children}</span>
}