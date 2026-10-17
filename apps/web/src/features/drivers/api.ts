import { http } from '@/shared/api/client'
import { object, string } from '@/shared/api/parse'
import { listDemoDrivers } from './demo'
import { parseDrivers, type Driver, type VehicleType } from './types'

/**
 * PLANNED, NOT IMPLEMENTED: GET /api/v1/drivers is not in the OpenAPI yet. Until the Gateway
 * serves it, VITE_MOCK_DRIVERS=true swaps in a demo list.
 */
export function isDriversDemoMode(): boolean {
  return import.meta.env.VITE_MOCK_DRIVERS === 'true'
}

export function listDrivers(): Promise<Driver[]> {
  if (isDriversDemoMode()) return listDemoDrivers()
  return http.get('/api/v1/drivers', parseDrivers)
}

/** Cuerpo de POST /api/v1/drivers: ya normalizado, con los nombres del contrato. */
export interface NewDriver {
  email: string
  password: string
  firstName: string
  lastName: string
  birthDate: string
  phone: string
  vehicleType: VehicleType
  identifier: string
  plate: string
  city: string
}

export interface CreatedDriver {
  id: string
  fullName: string
  email: string
}

function parseCreatedDriver(data: unknown): CreatedDriver {
  const o = object(data, 'alta')
  const driver = object(o.driver, 'driver')
  const user = object(o.user, 'user')
  return {
    id: string(driver, 'id'),
    fullName: `${string(driver, 'firstName')} ${string(driver, 'lastName')}`,
    email: string(user, 'email'),
  }
}

/** Crea el usuario DRIVER y su perfil (solo ADMIN). No se reintenta solo: un segundo intento reservaría otro correo. */
export function createDriver(input: NewDriver): Promise<CreatedDriver> {
  return http.post('/api/v1/drivers', parseCreatedDriver, { body: input })
}
