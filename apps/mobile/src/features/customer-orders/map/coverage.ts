import { useEffect, useState } from 'react'
import { http } from '../../../api/client'
import { isDemoMode } from '../../../api/config'
import { parseCoverageZones, type CoverageZone } from './geo'

export interface CoverageState {
  zones: CoverageZone[] | null
  loading: boolean
  failed: boolean
}

/** Zona de muestra para el modo demo, alrededor de Quito, donde el equipo ubica sus pruebas. */
const DEMO_ZONES: CoverageZone[] = [
  {
    id: 'demo-centro',
    code: 'DEMO',
    name: 'Zona demo',
    ring: [
      { latitude: -0.12, longitude: -78.52 },
      { latitude: -0.12, longitude: -78.43 },
      { latitude: -0.26, longitude: -78.43 },
      { latitude: -0.26, longitude: -78.52 },
    ],
    holes: [],
  },
]

/** Zonas activas donde se acepta un pedido: GET /api/v1/coverage/zones, disponible para cualquier usuario con sesión. */
export function useCoverageZones(): CoverageState {
  const [state, setState] = useState<CoverageState>({ zones: null, loading: true, failed: false })

  useEffect(() => {
    if (isDemoMode()) {
      setState({ zones: DEMO_ZONES, loading: false, failed: false })
      return undefined
    }
    const controller = new AbortController()
    http
      .get('/api/v1/coverage/zones', parseCoverageZones, { signal: controller.signal })
      .then((zones) => { if (!controller.signal.aborted) setState({ zones, loading: false, failed: false }) })
      .catch(() => { if (!controller.signal.aborted) setState({ zones: null, loading: false, failed: true }) })
    return () => { controller.abort() }
  }, [])

  return state
}
