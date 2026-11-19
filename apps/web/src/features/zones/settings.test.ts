import { describe, expect, it } from 'vitest'
import {
  defaultSettingsForm,
  parseSettings,
  settingsFormError,
  settingsFormFromZone,
  settingsFormIssues,
  settingsFromForm,
  zoneNameIssue,
  type SettingsForm,
} from './settings'

function filledForm(overrides: Partial<SettingsForm> = {}): SettingsForm {
  return {
    ...defaultSettingsForm(),
    depotName: 'Hub Norte',
    depotLatitude: '-0.179',
    depotLongitude: '-78.483',
    ...overrides,
  }
}

describe('settingsFormError', () => {
  it('acepta una configuración completa', () => {
    expect(settingsFormError(filledForm())).toBeNull()
  })

  it('pide la bodega de salida: sin depósito no hay rutas', () => {
    expect(settingsFormError(filledForm({ depotName: '   ' }))).toMatch(/bodega/)
  })

  it('rechaza coordenadas de bodega fuera de rango o vacías', () => {
    expect(settingsFormError(filledForm({ depotLatitude: '91' }))).toMatch(/latitud/)
    expect(settingsFormError(filledForm({ depotLongitude: '' }))).toMatch(/longitud/)
  })

  it('exige al menos un pedido por ruta entero', () => {
    expect(settingsFormError(filledForm({ maxOrdersPerRoute: '0' }))).toMatch(/pedidos por ruta/)
    expect(settingsFormError(filledForm({ maxOrdersPerRoute: '2.5' }))).toMatch(/pedidos por ruta/)
  })

  it('exige capacidad positiva', () => {
    expect(settingsFormError(filledForm({ routeCapacityKg: '0' }))).toMatch(/capacidad/)
  })

  it('exige al menos un día de servicio', () => {
    expect(settingsFormError(filledForm({ serviceDays: [] }))).toMatch(/día/)
  })

  it('exige que la ventana empiece antes de terminar', () => {
    expect(settingsFormError(filledForm({ deliveryWindowFrom: '20:00', deliveryWindowTo: '08:00' }))).toMatch(/ventana/)
  })

  it('valida el formato HH:MM de las horas de corte y despacho', () => {
    expect(settingsFormError(filledForm({ cutoffTime: '24:00' }))).toMatch(/HH:MM/)
    expect(settingsFormError(filledForm({ dispatchTime: '3pm' }))).toMatch(/HH:MM/)
  })

  it('exige un límite diario de al menos 1', () => {
    expect(settingsFormError(filledForm({ dailyOrderLimit: '0' }))).toMatch(/límite diario/)
  })
})

describe('settingsFromForm', () => {
  it('convierte los textos del formulario en números y recorta espacios', () => {
    const out = settingsFromForm(filledForm({ depotName: '  Hub Norte  ', maxOrdersPerRoute: '18', routeCapacityKg: '45' }))
    expect(out).toMatchObject({ depotName: 'Hub Norte', depotLatitude: -0.179, maxOrdersPerRoute: 18, routeCapacityKg: 45 })
  })

  it('devuelve null mientras el formulario tenga algún error', () => {
    expect(settingsFromForm(filledForm({ depotName: '' }))).toBeNull()
  })

  it('usa la zona horaria de Ecuador si el campo queda vacío', () => {
    expect(settingsFromForm(filledForm({ timezone: '  ' }))?.timezone).toBe('America/Guayaquil')
  })
})

describe('settingsFormFromZone', () => {
  it('carga una zona existente en el formulario para redibujarla', () => {
    const form = settingsFormFromZone({
      description: 'Norte',
      depotName: 'Hub Norte',
      depotLatitude: -0.179,
      depotLongitude: -78.483,
      maxOrdersPerRoute: 18,
      routeCapacityKg: 45,
      timezone: 'America/Guayaquil',
      serviceDays: ['MON', 'FRI'],
      deliveryWindowFrom: '08:00',
      deliveryWindowTo: '20:00',
      cutoffTime: '14:00',
      dispatchTime: '15:30',
      priority: 'HIGH',
      dailyOrderLimit: 250,
    })
    expect(form.depotLatitude).toBe('-0.179')
    expect(form.maxOrdersPerRoute).toBe('18')
    expect(form.serviceDays).toEqual(['MON', 'FRI'])
    expect(form.priority).toBe('HIGH')
  })

  it('deja el depósito vacío cuando la zona no tiene uno (zona anterior)', () => {
    const form = settingsFormFromZone(parseSettings(undefined))
    expect(form.depotName).toBe('')
    expect(form.depotLatitude).toBe('')
  })
})

describe('parseSettings', () => {
  it('rechaza un día de servicio que el contrato no define', () => {
    const data = { ...settingsFromForm(filledForm()), serviceDays: ['LUNES'] }
    expect(() => parseSettings(data)).toThrow('unexpected value')
  })
})

describe('limites y reglas de texto', () => {
  it('rechaza mas de 50 pedidos por ruta y acepta el maximo', () => {
    expect(settingsFormError(filledForm({ maxOrdersPerRoute: '51' }))).toMatch(/entre 1 y 50/)
    expect(settingsFormError(filledForm({ maxOrdersPerRoute: '50' }))).toBeNull()
  })

  it('rechaza mas de 1000 kg por ruta', () => {
    expect(settingsFormError(filledForm({ routeCapacityKg: '1001' }))).toMatch(/entre 1 y 1000/)
  })

  it('rechaza un limite diario por encima de 10000 pedidos', () => {
    expect(settingsFormError(filledForm({ dailyOrderLimit: '10001' }))).toMatch(/entre 1 y 10000/)
  })

  it('exige que la bodega este dentro de Ecuador', () => {
    expect(settingsFormError(filledForm({ depotLatitude: '40.7', depotLongitude: '-74' }))).toMatch(/Ecuador/)
  })

  it('la bodega solo admite letras: rechaza numeros', () => {
    expect(settingsFormError(filledForm({ depotName: 'Bodega 2' }))).toMatch(/solo admite letras/)
  })

  it('el nombre de zona admite letras, numeros y simbolos permitidos', () => {
    expect(zoneNameIssue('Hipercentro Financiero & La Carolina')).toBeNull()
    expect(zoneNameIssue('Zona 2 (Norte)')).toBeNull()
  })

  it('el nombre de zona rechaza menos de 3 caracteres y simbolos no permitidos', () => {
    expect(zoneNameIssue('Ab')).not.toBeNull()
    expect(zoneNameIssue('Zona @ Norte')).toMatch(/solo admite/)
  })

  it('settingsFormIssues lista todos los problemas, no solo el primero', () => {
    const issues = settingsFormIssues(filledForm({ depotName: '', maxOrdersPerRoute: '0', serviceDays: [] }))
    expect(issues.map((i) => i.field)).toEqual(expect.arrayContaining(['depotName', 'maxOrdersPerRoute', 'serviceDays']))
  })
})
