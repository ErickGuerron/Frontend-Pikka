import { describe, expect, it } from 'vitest'
import { mockApi, sentBody } from '@/test/utils'
import { classifyPoint, createZone, getZone } from './api'
import type { Coordinate } from './types'

const p1: Coordinate = { latitude: 19.43, longitude: -99.13 }
const p2: Coordinate = { latitude: 19.44, longitude: -99.13 }
const p3: Coordinate = { latitude: 19.44, longitude: -99.12 }
const closedRing = [p1, p2, p3, p1]

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
  it('envía la zona con anillo cerrado', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: zoneBody }))
    await createZone({ code: 'CENTRO', name: 'Centro', ring: closedRing })
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(sentBody(call?.[1])).toEqual({ code: 'CENTRO', name: 'Centro', ring: closedRing })
  })

  it('no llama a la API si el anillo está abierto', async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: zoneBody }))
    await expect(createZone({ code: 'X', name: 'Abierta', ring: [p1, p2, p3] })).rejects.toThrow(RangeError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('classifyPoint', () => {
  it('envía latitud y longitud como query string', async () => {
    const fetchMock = mockApi(() => ({ status: 200, body: zoneBody }))
    const zone = await classifyPoint(p1)
    expect(zone.id).toBe('z-1')
    const url = fetchMock.mock.calls.map(([u]) => u).join(' ')
    expect(url).toContain('/api/v1/zones/classify?')
    expect(url).toContain('latitude=19.43')
    expect(url).toContain('longitude=-99.13')
  })

  it('propaga el 404 cuando ninguna zona contiene el punto', async () => {
    mockApi(() => ({ status: 404, body: { error: { code: 'NOT_FOUND', message: 'no zone' } } }))
    await expect(classifyPoint(p1)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
