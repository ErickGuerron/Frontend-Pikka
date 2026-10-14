import type { Driver } from './types'

/** Datos de muestra para VITE_MOCK_DRIVERS=true. No se guardan ni se envían a ningún lado. */
export function listDemoDrivers(): Promise<Driver[]> {
  return Promise.resolve([
    { id: 'd-1', fullName: 'Luis Andrade', phone: '0991112233', active: true, status: 'AVAILABLE' },
    { id: 'd-2', fullName: 'María Paredes', phone: '0992223344', active: true, status: 'ON_ROUTE' },
    { id: 'd-3', fullName: 'Jorge Vélez', phone: '0993334455', active: true, status: 'ASSIGNED' },
    { id: 'd-4', fullName: 'Ana Salazar', phone: '0994445566', active: false, status: 'OFFLINE' },
  ])
}
