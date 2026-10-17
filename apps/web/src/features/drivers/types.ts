export const driverStatuses = ['AVAILABLE', 'ASSIGNED', 'ON_ROUTE', 'OFFLINE'] as const
export type DriverStatus = (typeof driverStatuses)[number]

export const driverStatusLabels: Record<DriverStatus, string> = {
  AVAILABLE: 'Disponible',
  ASSIGNED: 'Asignado',
  ON_ROUTE: 'En ruta',
  OFFLINE: 'Fuera de línea',
}

/** Tipos de vehículo que acepta el backend; el texto mostrado va aparte. */
export const vehicleTypes = ['MOTORIZADO', 'AUTOMOVIL', 'SUV'] as const
export type VehicleType = (typeof vehicleTypes)[number]

export const vehicleTypeLabels: Record<VehicleType, string> = {
  MOTORIZADO: 'Motorizado',
  AUTOMOVIL: 'Automóvil',
  SUV: 'SUV',
}

/** Vista del repartidor para el operador. Sin datos de acceso ni de pagos. */
export interface Driver {
  id: string
  fullName: string
  phone: string
  city: string
  vehicleType: VehicleType
  plate: string
  active: boolean
  status: DriverStatus
}

function record(data: unknown, what: string): Record<string, unknown> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new RangeError(`${what}: se esperaba un objeto`)
  return data as Record<string, unknown>
}

function text(obj: Record<string, unknown>, key: string): string {
  const value = obj[key]
  if (typeof value !== 'string') throw new RangeError(`${key}: se esperaba texto`)
  return value
}

export function parseDriver(data: unknown): Driver {
  const o = record(data, 'driver')
  const status = text(o, 'status')
  if (!(driverStatuses as readonly string[]).includes(status)) throw new RangeError(`status: valor desconocido ${status}`)
  if (typeof o.active !== 'boolean') throw new RangeError('active: se esperaba booleano')
  const vehicleType = text(o, 'vehicleType')
  if (!(vehicleTypes as readonly string[]).includes(vehicleType)) throw new RangeError(`vehicleType: valor desconocido ${vehicleType}`)
  return {
    id: text(o, 'id'),
    fullName: text(o, 'fullName'),
    phone: text(o, 'phone'),
    city: text(o, 'city'),
    vehicleType: vehicleType as VehicleType,
    plate: text(o, 'plate'),
    active: o.active,
    status: status as DriverStatus,
  }
}

export function parseDrivers(data: unknown): Driver[] {
  if (!Array.isArray(data)) throw new RangeError('drivers: se esperaba una lista')
  return data.map((item) => parseDriver(item))
}

/** Filtra por texto (nombre, teléfono, ciudad o placa) y por estado. `status` 'ALL' no filtra. */
export function filterDrivers(drivers: readonly Driver[], query: string, status: DriverStatus | 'ALL'): Driver[] {
  const q = query.trim().toLowerCase()
  return drivers.filter((driver) => {
    if (status !== 'ALL' && driver.status !== status) return false
    if (q === '') return true
    return (
      driver.fullName.toLowerCase().includes(q) ||
      driver.phone.includes(q) ||
      driver.city.toLowerCase().includes(q) ||
      driver.plate.toLowerCase().includes(q)
    )
  })
}
