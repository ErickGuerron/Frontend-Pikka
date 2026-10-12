import { enumArray, enumValue, number, object, string } from '@/shared/api/parse'

/** Configuración operativa de una zona (zones.v1, mensaje ZoneSettings). Solo ADMIN la define. */

export const zonePriorities = ['NORMAL', 'HIGH', 'LOW'] as const
export type ZonePriority = (typeof zonePriorities)[number]

export const zonePriorityLabels: Record<ZonePriority, string> = {
  NORMAL: 'Normal',
  HIGH: 'Alta (despacho preferente)',
  LOW: 'Baja',
}

export const weekdayCodes = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
export type WeekdayCode = (typeof weekdayCodes)[number]

export const weekdayLabels: Record<WeekdayCode, string> = {
  MON: 'Lun',
  TUE: 'Mar',
  WED: 'Mié',
  THU: 'Jue',
  FRI: 'Vie',
  SAT: 'Sáb',
  SUN: 'Dom',
}

/** Zona horaria por defecto del negocio. Coincide con el valor por defecto del backend. */
export const DEFAULT_TIMEZONE = 'America/Guayaquil'

export interface ZoneSettings {
  description: string
  /** Bodega o almacén de salida. Vacío en zonas anteriores a la configuración. */
  depotName: string
  depotLatitude: number
  depotLongitude: number
  maxOrdersPerRoute: number
  routeCapacityKg: number
  timezone: string
  serviceDays: WeekdayCode[]
  /** Horas locales HH:MM. */
  deliveryWindowFrom: string
  deliveryWindowTo: string
  cutoffTime: string
  dispatchTime: string
  priority: ZonePriority
  dailyOrderLimit: number
}

/** Lo que el formulario maneja: los números se escriben como texto hasta validarse. */
export interface SettingsForm {
  description: string
  depotName: string
  depotLatitude: string
  depotLongitude: string
  maxOrdersPerRoute: string
  routeCapacityKg: string
  timezone: string
  serviceDays: WeekdayCode[]
  deliveryWindowFrom: string
  deliveryWindowTo: string
  cutoffTime: string
  dispatchTime: string
  priority: ZonePriority
  dailyOrderLimit: string
}

/** Valores iniciales de una zona nueva. El depósito queda vacío: el administrador debe elegirlo. */
export function defaultSettingsForm(): SettingsForm {
  return {
    description: '',
    depotName: '',
    depotLatitude: '',
    depotLongitude: '',
    maxOrdersPerRoute: '4',
    routeCapacityKg: '45',
    timezone: DEFAULT_TIMEZONE,
    serviceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    deliveryWindowFrom: '08:00',
    deliveryWindowTo: '20:00',
    cutoffTime: '14:00',
    dispatchTime: '15:30',
    priority: 'NORMAL',
    dailyOrderLimit: '250',
  }
}

/** Convierte una configuración recibida en el formulario para editarla. */
export function settingsFormFromZone(settings: ZoneSettings): SettingsForm {
  return {
    description: settings.description,
    depotName: settings.depotName,
    depotLatitude: settings.depotName === '' ? '' : String(settings.depotLatitude),
    depotLongitude: settings.depotName === '' ? '' : String(settings.depotLongitude),
    maxOrdersPerRoute: String(settings.maxOrdersPerRoute),
    routeCapacityKg: String(settings.routeCapacityKg),
    timezone: settings.timezone,
    serviceDays: settings.serviceDays,
    deliveryWindowFrom: settings.deliveryWindowFrom,
    deliveryWindowTo: settings.deliveryWindowTo,
    cutoffTime: settings.cutoffTime,
    dispatchTime: settings.dispatchTime,
    priority: settings.priority,
    dailyOrderLimit: String(settings.dailyOrderLimit),
  }
}

/**
 * Límites de operación e inventario. Deben coincidir con el backend (internal/domain/settings.go):
 * una furgoneta o moto no carga más de 50 pedidos ni una tonelada, y los picos de fecha llegan a miles.
 */
export const LIMITS = {
  maxOrdersPerRoute: 50,
  maxRouteCapacityKg: 1000,
  maxDailyOrderLimit: 10000,
  maxDescription: 500,
  depotNameMin: 3,
  depotNameMax: 120,
  zoneNameMin: 3,
  zoneNameMax: 120,
  // Ecuador continental y Galápagos.
  latitude: { min: -5, max: 2 },
  longitude: { min: -92, max: -75 },
} as const

const clockPattern = /^([01]\d|2[0-3]):[0-5]\d$/
const wholePattern = /^\d+$/
/** Nombre de zona: letras, números, espacios y . - & ( ) ' */
const zoneNamePattern = /^[\p{L}\p{N} .&()'-]+$/u
/** Nombre de bodega: solo letras, espacios y . - ' (la bodega se nombra con palabras). */
const depotNamePattern = /^[\p{L} .'-]+$/u

/** Un problema concreto del formulario: qué campo y qué corregir, en español. */
export interface SettingsIssue {
  field: keyof SettingsForm
  message: string
}

/** Motivo por el que el nombre de la zona no sirve, o null si es válido. */
export function zoneNameIssue(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < LIMITS.zoneNameMin || trimmed.length > LIMITS.zoneNameMax) {
    return `El nombre debe tener entre ${String(LIMITS.zoneNameMin)} y ${String(LIMITS.zoneNameMax)} caracteres.`
  }
  if (!zoneNamePattern.test(trimmed)) return "El nombre solo admite letras, números, espacios y . - & ( ) '."
  return null
}

/** Todos los problemas de la configuración, en el orden del formulario. Vacío si está lista para guardar. */
export function settingsFormIssues(form: SettingsForm): SettingsIssue[] {
  const issues: SettingsIssue[] = []
  const add = (field: keyof SettingsForm, message: string) => { issues.push({ field, message }) }

  if (form.description.trim().length > LIMITS.maxDescription) add('description', `La descripción no puede pasar de ${String(LIMITS.maxDescription)} caracteres.`)

  const depot = form.depotName.trim()
  if (depot === '') add('depotName', `Indica la bodega de salida: de ${String(LIMITS.depotNameMin)} a ${String(LIMITS.depotNameMax)} letras.`)
  else if (depot.length < LIMITS.depotNameMin || depot.length > LIMITS.depotNameMax) add('depotName', `La bodega debe tener entre ${String(LIMITS.depotNameMin)} y ${String(LIMITS.depotNameMax)} caracteres.`)
  else if (!depotNamePattern.test(depot)) add('depotName', "La bodega solo admite letras, espacios y . - '.")

  const lat = toNumber(form.depotLatitude)
  if (lat === null) add('depotLatitude', `Indica la latitud de la bodega (entre ${String(LIMITS.latitude.min)} y ${String(LIMITS.latitude.max)}).`)
  else if (lat < LIMITS.latitude.min || lat > LIMITS.latitude.max) add('depotLatitude', `La latitud debe estar en Ecuador: entre ${String(LIMITS.latitude.min)} y ${String(LIMITS.latitude.max)}.`)

  const lng = toNumber(form.depotLongitude)
  if (lng === null) add('depotLongitude', `Indica la longitud de la bodega (entre ${String(LIMITS.longitude.min)} y ${String(LIMITS.longitude.max)}).`)
  else if (lng < LIMITS.longitude.min || lng > LIMITS.longitude.max) add('depotLongitude', `La longitud debe estar en Ecuador: entre ${String(LIMITS.longitude.min)} y ${String(LIMITS.longitude.max)}.`)

  if (!isWhole(form.maxOrdersPerRoute, 1, LIMITS.maxOrdersPerRoute)) add('maxOrdersPerRoute', `El máximo de pedidos por ruta debe ser un entero entre 1 y ${String(LIMITS.maxOrdersPerRoute)}.`)

  const capacity = toNumber(form.routeCapacityKg)
  if (capacity === null || capacity <= 0 || capacity > LIMITS.maxRouteCapacityKg) add('routeCapacityKg', `La capacidad por ruta debe ser un número entre 1 y ${String(LIMITS.maxRouteCapacityKg)} kg.`)

  if (form.serviceDays.length === 0) add('serviceDays', 'Selecciona al menos un día de servicio.')

  const windowValid = clockPattern.test(form.deliveryWindowFrom) && clockPattern.test(form.deliveryWindowTo)
  if (!windowValid) add('deliveryWindowFrom', 'La ventana de entrega debe tener horas HH:MM.')
  else if (form.deliveryWindowFrom >= form.deliveryWindowTo) add('deliveryWindowTo', 'El inicio de la ventana debe ser anterior a su fin.')

  if (!clockPattern.test(form.cutoffTime) || !clockPattern.test(form.dispatchTime)) add('cutoffTime', 'Las horas de corte y despacho deben ser HH:MM.')

  if (!isWhole(form.dailyOrderLimit, 1, LIMITS.maxDailyOrderLimit)) add('dailyOrderLimit', `El límite diario debe ser un entero entre 1 y ${String(LIMITS.maxDailyOrderLimit)}.`)

  return issues
}

/** Primer problema del formulario, en español, o null si la configuración es válida. */
export function settingsFormError(form: SettingsForm): string | null {
  return settingsFormIssues(form)[0]?.message ?? null
}

/** Configuración lista para enviar, o null si el formulario tiene algún error. */
export function settingsFromForm(form: SettingsForm): ZoneSettings | null {
  if (settingsFormError(form) !== null) return null
  return {
    description: form.description.trim(),
    depotName: form.depotName.trim(),
    depotLatitude: Number(form.depotLatitude),
    depotLongitude: Number(form.depotLongitude),
    maxOrdersPerRoute: Number(form.maxOrdersPerRoute),
    routeCapacityKg: Number(form.routeCapacityKg),
    timezone: form.timezone.trim() === '' ? DEFAULT_TIMEZONE : form.timezone.trim(),
    serviceDays: [...form.serviceDays],
    deliveryWindowFrom: form.deliveryWindowFrom,
    deliveryWindowTo: form.deliveryWindowTo,
    cutoffTime: form.cutoffTime,
    dispatchTime: form.dispatchTime,
    priority: form.priority,
    dailyOrderLimit: Number(form.dailyOrderLimit),
  }
}

/** Lee la configuración de una respuesta. Una respuesta sin configuración se lee como zona sin depósito. */
export function parseSettings(data: unknown): ZoneSettings {
  if (data === undefined) return emptySettings()
  const o = object(data, 'settings')
  return {
    description: string(o, 'description'),
    depotName: string(o, 'depotName'),
    depotLatitude: number(o, 'depotLatitude'),
    depotLongitude: number(o, 'depotLongitude'),
    maxOrdersPerRoute: number(o, 'maxOrdersPerRoute'),
    routeCapacityKg: number(o, 'routeCapacityKg'),
    timezone: string(o, 'timezone'),
    serviceDays: enumArray(o, 'serviceDays', weekdayCodes),
    deliveryWindowFrom: string(o, 'deliveryWindowFrom'),
    deliveryWindowTo: string(o, 'deliveryWindowTo'),
    cutoffTime: string(o, 'cutoffTime'),
    dispatchTime: string(o, 'dispatchTime'),
    priority: enumValue(o.priority, zonePriorities, 'priority'),
    dailyOrderLimit: number(o, 'dailyOrderLimit'),
  }
}

/** Configuración vacía para respuestas anteriores a la configuración operativa. */
function emptySettings(): ZoneSettings {
  return {
    description: '',
    depotName: '',
    depotLatitude: 0,
    depotLongitude: 0,
    maxOrdersPerRoute: 0,
    routeCapacityKg: 0,
    timezone: DEFAULT_TIMEZONE,
    serviceDays: [],
    deliveryWindowFrom: '',
    deliveryWindowTo: '',
    cutoffTime: '',
    dispatchTime: '',
    priority: 'NORMAL',
    dailyOrderLimit: 0,
  }
}

function toNumber(text: string): number | null {
  if (text.trim() === '') return null
  const value = Number(text)
  return Number.isFinite(value) ? value : null
}

/** Entero solo con dígitos, dentro de [min, max]. */
function isWhole(text: string, min: number, max = Number.MAX_SAFE_INTEGER): boolean {
  return wholePattern.test(text.trim()) && Number(text) >= min && Number(text) <= max
}
