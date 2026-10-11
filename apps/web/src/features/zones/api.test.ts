import { describe, expect, it } from 'vitest'
import { mockApi, sentBody } from '@/test/utils'
import { classifyPoint, createZone, deleteZone, getZone, listZones, setZoneStatus, updateZone } from './api'
import type { Coordinate } from './types'

const s1: Coordinate = { latitude: -0.2, longitude: -78.5 }
const s2: Coordinate = { latitude: -0.2, longitude: -78.4 }
const s3: Coordinate = { latitude: -0.1, longitude: -78.4 }
const s4: Coordinate = { latitude: -0.1, longitude: -78.5 }
const closedRing = [s1, s2, s3, s4, s1]

// Dardo: un vértice hacia adentro. Cerrado, pero no convexo.
const dartRing: Coordinate[] = [
  { latitude: 0, longitude: 0 },
  { latitude: 2, longitude: 4 },
  { latitude: 4, longitude: 0 },
  { latitude: 2, longitude: 1 },
  { latitude: 0, longitude: 0 },
]

const zoneBody = { id: 'z-1', code: 'CENTRO', name: 'Centro', ring: closedRing, createdAt: '2026-10-10T12:00:00Z' }

describe('getZone', () => {
  it('consulta la zona por id y devuelve el modelo validado', async () => {
    const fetchMock = mockApi(() => ({ status: 200, body: zoneBody }))
    const zone = await getZone('z-1')
    expect(zone.code).toBe('CENTRO')
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([expect.stringMatching(/\/api\/v1\/zones\/z-1$/)])
  })

  it('rechaza una respuesta con forma inesperada', async () => {
    mockApi(() => ({ status: 200, body: { ...zoneBody, ring: 'no-es-lista' } }))
    await expect(getZone('z-1')).rejects.toThrow('ring: expected array')
  })
})

describe('createZone', () => {
  it('envía la zona con un cuadrado cerrado', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: zoneBody }))
    await createZone({ name: 'Centro', ring: closedRing })
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(sentBody(call?.[1])).toEqual({ name: 'Centro', ring: closedRing })
  })

  it('no llama a la API si el anillo está abierto', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: zoneBody }))
    await expect(createZone({ name: 'Abierta', ring: [s1, s2, s3, s4] })).rejects.toThrow(RangeError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('no llama a la API si la figura no es convexa', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: zoneBody }))
    await expect(createZone({ name: 'Dardo', ring: dartRing })).rejects.toThrow(/convexa/)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('classifyPoint', () => {
  it('envía latitud y longitud como query string', async () => {
    const fetchMock = mockApi(() => ({ status: 200, body: zoneBody }))
    const zone = await classifyPoint(s1)
    expect(zone.id).toBe('z-1')
    const url = fetchMock.mock.calls.map(([u]) => u).join(' ')
    expect(url).toContain('/api/v1/zones/classify?')
    expect(url).toContain('latitude=-0.2')
    expect(url).toContain('longitude=-78.5')
  })

  it('propaga el 404 cuando ninguna zona contiene el punto', async () => {
    mockApi(() => ({ status: 404, body: { error: { code: 'NOT_FOUND', message: 'no zone' } } }))
    await expect(classifyPoint(s1)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})

describe('createZone con huecos', () => {
  const hole = [
    { latitude: -0.18, longitude: -78.48 },
    { latitude: -0.18, longitude: -78.42 },
    { latitude: -0.12, longitude: -78.42 },
    { latitude: -0.12, longitude: -78.48 },
    { latitude: -0.18, longitude: -78.48 },
  ]

  it('envía los huecos cuando están dentro de la zona', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: zoneBody }))
    await createZone({ name: 'Dona', ring: closedRing, holes: [hole] })
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(sentBody(call?.[1])).toEqual({ name: 'Dona', ring: closedRing, holes: [hole] })
  })

  it('no llama a la API si un hueco sale de la zona', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: zoneBody }))
    const outside = hole.map((p) => ({ latitude: p.latitude - 1, longitude: p.longitude }))
    await expect(createZone({ name: 'Fuera', ring: closedRing, holes: [outside] })).rejects.toThrow(/holes: .*dentro/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('no envía el campo holes cuando no hay huecos', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: zoneBody }))
    await createZone({ name: 'Centro', ring: closedRing, holes: [] })
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(sentBody(call?.[1])).toEqual({ name: 'Centro', ring: closedRing })
  })
})

describe('listZones y updateZone', () => {
  it('lista las zonas con sus huecos', async () => {
    const fetchMock = mockApi(() => ({ status: 200, body: [{ ...zoneBody, holes: [] }] }))
    const zones = await listZones()
    expect(zones).toHaveLength(1)
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([expect.stringMatching(/\/api\/v1\/zones$/)])
  })

  it('redibuja con PUT sobre el identificador de la zona', async () => {
    const fetchMock = mockApi(() => ({ status: 200, body: zoneBody }))
    await updateZone('z-1', { name: 'Centro 2', ring: closedRing })
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(call?.[0]).toMatch(/\/api\/v1\/zones\/z-1$/)
    expect(sentBody(call?.[1])).toEqual({ name: 'Centro 2', ring: closedRing })
  })

  it('no llama a la API al redibujar con una figura inv�lida', async () => {
    const fetchMock = mockApi(() => ({ status: 200, body: zoneBody }))
    await expect(updateZone('z-1', { name: 'X', ring: [s1, s2, s3, s4] })).rejects.toThrow(RangeError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('setZoneStatus y deleteZone', () => {
  it('desactiva con PATCH enviando el motivo', async () => {
    const fetchMock = mockApi(() => ({ status: 200, body: { ...zoneBody, status: 'INACTIVE', statusReason: 'Obras' } }))
    const zone = await setZoneStatus('z-1', 'INACTIVE', 'Obras en la avenida')
    expect(zone.status).toBe('INACTIVE')
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')
    expect(call?.[0]).toMatch(/\/api\/v1\/zones\/z-1\/status$/)
    expect(sentBody(call?.[1])).toEqual({ status: 'INACTIVE', reason: 'Obras en la avenida' })
  })

  it('borra con DELETE enviando el motivo y acepta la respuesta 204 sin cuerpo', async () => {
    // El simulador no puede enviar un 204 sin cuerpo; el cliente trata cualquier cuerpo vacío como null.
    const fetchMock = mockApi(() => ({ status: 200, body: null }))
    await expect(deleteZone('z-1', 'Zona creada por error')).resolves.toBeUndefined()
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE')
    expect(call?.[0]).toMatch(/\/api\/v1\/zones\/z-1$/)
    expect(sentBody(call?.[1])).toEqual({ reason: 'Zona creada por error' })
  })
})
