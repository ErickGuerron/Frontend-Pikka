import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Coordinate } from '@/features/geo/types'
import { ClassifyPanel, type ClassifyPanelProps } from './ClassifyPanel'
import type { ZoneSettings } from './settings'
import type { Zone } from './types'

// Lunes 2026-11-02 a las 10:00 UTC: en America/Guayaquil (UTC-5) son las 05:00 del lunes.
const MONDAY_0500_LOCAL = new Date('2026-11-02T10:00:00Z')
// Lunes 15:00 local, ya pasado el corte de las 14:00.
const MONDAY_1500_LOCAL = new Date('2026-11-02T20:00:00Z')
// Domingo 12:00 local: la zona no presta servicio ese día.
const SUNDAY_1200_LOCAL = new Date('2026-11-01T17:00:00Z')

const point: Coordinate = { latitude: -0.15, longitude: -78.45 }

const settings: ZoneSettings = {
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
}

const square = (lat: number, lng: number, size: number): Coordinate[] => [
  { latitude: lat, longitude: lng },
  { latitude: lat, longitude: lng + size },
  { latitude: lat + size, longitude: lng + size },
  { latitude: lat + size, longitude: lng },
  { latitude: lat, longitude: lng },
]

function buildZone(overrides: Partial<Zone> = {}): Zone {
  return {
    id: 'z-1',
    code: 'CENTRO-001',
    name: 'Centro Histórico',
    ring: square(-0.2, -78.5, 0.1),
    holes: [],
    status: 'ACTIVE',
    statusReason: '',
    createdAt: '2026-10-10T12:00:00Z',
    settings,
    version: 1,
    updatedAt: '2026-10-10T12:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
    ...overrides,
  }
}

function renderPanel(overrides: Partial<ClassifyPanelProps> = {}) {
  const props: ClassifyPanelProps = {
    point,
    placeLabel: 'Av. Amazonas, Quito',
    zone: buildZone(),
    outside: false,
    pending: false,
    failed: false,
    errorMessage: null,
    now: MONDAY_0500_LOCAL,
    ...overrides,
  }
  render(<ClassifyPanel {...props} />)
}

describe('diagnóstico de cobertura de un punto', () => {
  it('pide elegir un punto cuando todavía no hay ninguno', () => {
    renderPanel({ point: null, zone: null, placeLabel: null })

    expect(screen.getByText('Sin punto')).toBeInTheDocument()
    expect(screen.getByText(/haz clic en el mapa/)).toBeInTheDocument()
    expect(screen.queryByText('Diagnóstico de cobertura', { exact: false })).toBeInTheDocument()
  })

  it('muestra la dirección elegida y sus coordenadas con seis decimales', () => {
    renderPanel()

    expect(screen.getByText('Av. Amazonas, Quito')).toBeInTheDocument()
    expect(screen.getByText('Lat -0.150000 · Lng -78.450000')).toBeInTheDocument()
  })

  it('usa el texto genérico cuando el punto no tiene dirección legible', () => {
    renderPanel({ placeLabel: null })

    expect(screen.getByText('Punto elegido')).toBeInTheDocument()
  })

  it('muestra que está clasificando mientras llega la respuesta', () => {
    renderPanel({ pending: true, zone: null })

    expect(screen.getByText('Clasificando…')).toBeInTheDocument()
    expect(screen.getByText('Clasificando.')).toBeInTheDocument()
  })

  it('indica cobertura válida y el nombre de la zona cuando el punto cae en una zona', () => {
    renderPanel()

    expect(screen.getByText('COBERTURA VÁLIDA (EN ZONA)')).toBeInTheDocument()
    expect(screen.getByText('Centro Histórico', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })

  it('informa que ninguna zona cubre el punto cuando el backend responde fuera de cobertura', () => {
    renderPanel({ zone: null, outside: true })

    expect(screen.getByText('FUERA DE COBERTURA')).toBeInTheDocument()
    expect(screen.getByText('Ninguna zona cubre este punto.')).toBeInTheDocument()
  })

  it('muestra "Sin resultado" cuando no hay zona ni fuera de cobertura', () => {
    renderPanel({ zone: null, outside: false })

    expect(screen.getByText('Sin resultado')).toBeInTheDocument()
  })

  it('muestra el error de clasificación cuando la consulta falla', () => {
    renderPanel({ zone: null, failed: true, errorMessage: 'No pudimos clasificar el punto. Error.' })

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos clasificar el punto. Error.')
  })

  it('no muestra error si la consulta falló pero no hay mensaje que mostrar', () => {
    renderPanel({ zone: null, failed: true, errorMessage: null })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muestra la prioridad, la descripción y la etiqueta de estado de la zona', () => {
    renderPanel({
      zone: buildZone({ settings: { ...settings, description: 'Zona comercial' }, status: 'ACTIVE' }),
    })

    expect(screen.getByText('Prioridad Normal')).toBeInTheDocument()
    expect(screen.getByText('Zona comercial')).toBeInTheDocument()
  })

  it('una zona inactiva muestra su motivo registrado', () => {
    renderPanel({ zone: buildZone({ status: 'INACTIVE', statusReason: 'Mantenimiento de red' }) })

    expect(screen.getByText('Inactiva')).toBeInTheDocument()
    expect(screen.getByText('Zona inactiva: Mantenimiento de red')).toBeInTheDocument()
  })

  it('una zona inactiva sin motivo lo indica en la lista de verificación', () => {
    renderPanel({ zone: buildZone({ status: 'INACTIVE', statusReason: '' }) })

    expect(screen.getByText('Zona inactiva: sin motivo registrado')).toBeInTheDocument()
  })

  it('confirma que la zona no tiene huecos cuando no los define', () => {
    renderPanel()

    expect(screen.getByText('La zona no tiene huecos de exclusión')).toBeInTheDocument()
  })

  it('indica que el punto queda fuera de los huecos, en singular o plural', () => {
    const farHole = square(-0.05, -78.3, 0.01)
    const { unmount } = render(<ClassifyPanel point={point} placeLabel={null} zone={buildZone({ holes: [farHole] })} outside={false} pending={false} failed={false} errorMessage={null} now={MONDAY_0500_LOCAL} />)
    expect(screen.getByText('Fuera de 1 hueco de exclusión')).toBeInTheDocument()
    unmount()

    renderPanel({ zone: buildZone({ holes: [farHole, square(-0.04, -78.2, 0.01)] }) })
    expect(screen.getByText('Fuera de 2 huecos de exclusión')).toBeInTheDocument()
  })

  it('advierte cuando el punto cae dentro de un hueco de exclusión', () => {
    const hole = square(-0.16, -78.46, 0.02)
    renderPanel({ zone: buildZone({ holes: [hole] }) })

    expect(screen.getByText('Dentro de un hueco de exclusión (1)')).toBeInTheDocument()
  })

  it('calcula la distancia en línea recta a la bodega cuando la zona tiene una', () => {
    renderPanel()

    expect(screen.getByText('Hub Norte')).toBeInTheDocument()
    expect(screen.getByText(/^\d+\.\d km$/)).toBeInTheDocument()
    expect(screen.getByText(/Distancia en línea recta/)).toBeInTheDocument()
  })

  it('avisa que la zona no tiene bodega asignada y no calcula distancia', () => {
    renderPanel({ zone: buildZone({ settings: { ...settings, depotName: '' } }) })

    expect(screen.getByText(/aún no tiene bodega asignada/)).toBeInTheDocument()
    expect(screen.queryByText(/km$/)).not.toBeInTheDocument()
  })

  it('marca el día de hoy en la semana de servicio con su título', () => {
    renderPanel()

    expect(screen.getByTitle('Lun: servicio (hoy)')).toBeInTheDocument()
    expect(screen.getByTitle('Dom: sin servicio')).toBeInTheDocument()
  })

  it('acepta pedidos para hoy y muestra el tiempo que falta para el corte', () => {
    renderPanel()

    expect(screen.getByText(/Acepta pedidos para hoy · corte 14:00 \(faltan 9h 0m\)/)).toBeInTheDocument()
  })

  it('avisa que el corte de hoy ya pasó cuando es día de servicio pero es tarde', () => {
    renderPanel({ now: MONDAY_1500_LOCAL })

    expect(screen.getByText(/Corte de hoy ya pasó \(14:00\)/)).toBeInTheDocument()
  })

  it('avisa que hoy no hay servicio en un día fuera del horario de la zona', () => {
    renderPanel({ now: SUNDAY_1200_LOCAL })

    expect(screen.getByText('Hoy la zona no tiene servicio.')).toBeInTheDocument()
  })

  it('no puede leer la hora local cuando la zona horaria es inválida', () => {
    renderPanel({ zone: buildZone({ settings: { ...settings, timezone: 'No/Existe' } }) })

    expect(screen.getByText('No se pudo leer la hora local de la zona.')).toBeInTheDocument()
  })

  it('muestra la ventana, el despacho y la zona horaria de la configuración', () => {
    renderPanel()

    expect(screen.getByText(/Ventana 08:00–20:00 · Despacho 15:30 · America\/Guayaquil/)).toBeInTheDocument()
  })

  it('muestra la capacidad configurada: pedidos por ruta, kilos y límite diario', () => {
    renderPanel()

    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('45 kg')).toBeInTheDocument()
    expect(screen.getByText('250 pedidos/día')).toBeInTheDocument()
  })

  describe('copiar la ficha de cobertura', () => {
    let writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>

    beforeEach(() => {
      vi.useFakeTimers()
      writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve())
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    })

    afterEach(() => {
      vi.useRealTimers()
      Reflect.deleteProperty(navigator, 'clipboard')
    })

    it('copia un resumen de la zona y cambia el icono para confirmar la copia', () => {
      renderPanel()

      fireEvent.click(screen.getByTitle('Copiar ficha de cobertura'))

      expect(writeText).toHaveBeenCalledExactlyOnceWith('ZONA: CENTRO-001 | Centro Histórico | Bodega: Hub Norte | Corte: 14:00 | Cobertura: OK')
      expect(screen.getByText('done')).toBeInTheDocument()
    })

    it('vuelve al icono de copiar pasado el tiempo de confirmación', () => {
      renderPanel()
      fireEvent.click(screen.getByTitle('Copiar ficha de cobertura'))

      act(() => {
        vi.advanceTimersByTime(1800)
      })

      expect(screen.getByText('content_copy')).toBeInTheDocument()
    })

    it('indica en la ficha copiada que la zona no tiene bodega asignada', () => {
      renderPanel({ zone: buildZone({ settings: { ...settings, depotName: '' } }) })

      fireEvent.click(screen.getByTitle('Copiar ficha de cobertura'))

      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Bodega: sin asignar'))
    })
  })
})
