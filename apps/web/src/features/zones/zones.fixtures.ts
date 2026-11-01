import type { Zone } from './types'

/** Ring cerrado de 0.1° en Quito: SW, SE, NE, NW y vuelve al SW. */
export const SQUARE_RING: Zone['ring'] = [
  { latitude: -0.2, longitude: -78.5 },
  { latitude: -0.2, longitude: -78.4 },
  { latitude: -0.1, longitude: -78.4 },
  { latitude: -0.1, longitude: -78.5 },
  { latitude: -0.2, longitude: -78.5 },
]

export function buildZoneSettings(overrides: Partial<Zone['settings']> = {}): Zone['settings'] {
  return {
    description: '',
    depotName: 'Hub Norte',
    depotLatitude: -0.179,
    depotLongitude: -78.483,
    maxOrdersPerRoute: 4,
    routeCapacityKg: 45,
    timezone: 'America/Guayaquil',
    serviceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    deliveryWindowFrom: '08:00',
    deliveryWindowTo: '20:00',
    cutoffTime: '14:00',
    dispatchTime: '15:30',
    priority: 'NORMAL',
    dailyOrderLimit: 250,
    ...overrides,
  }
}

export function buildZone(overrides: Partial<Zone> = {}): Zone {
  return {
    id: 'z-1',
    code: 'CENTRO-001',
    name: 'Centro Histórico',
    ring: SQUARE_RING,
    holes: [],
    status: 'ACTIVE',
    statusReason: '',
    createdAt: '2026-10-10T12:00:00Z',
    settings: buildZoneSettings(),
    version: 1,
    updatedAt: '2026-10-10T12:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
    ...overrides,
  }
}
