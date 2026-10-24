import { trackingMapState } from '../src/features/customer-orders/tracking-map'

const delivery = { latitude: -1.24, longitude: -78.62 }
const driver = { latitude: -1.2425, longitude: -78.6205 }
const road = [delivery, driver]

describe('trackingMapState', () => {
  it('sin repartidor vuela al punto de entrega', () => {
    const state = trackingMapState({ driver: null, delivery, road: [], follow: false, fit: null })
    expect(state.focus).toEqual(delivery)
    expect(state.driver).toBeNull()
  })

  it('con repartidor y sin seguirlo no mueve la vista: el encuadre inicial ya lo muestra', () => {
    const state = trackingMapState({ driver, delivery, road, follow: false, fit: null })
    expect(state.focus).toBeNull()
    expect(state.driver).toEqual(driver)
    expect(state.delivery).toEqual(delivery)
  })

  it('siguiendo al repartidor, el foco es su posicion actual', () => {
    const state = trackingMapState({ driver, delivery, road, follow: true, fit: null })
    expect(state.focus).toEqual(driver)
  })

  it('un encuadre pedido por el cliente pasa tal cual con su clave', () => {
    const fit = { points: [driver], key: 'r1' }
    const state = trackingMapState({ driver, delivery, road, follow: false, fit })
    expect(state.fit).toEqual(fit)
  })

  it('sin punto de entrega ni repartidor no hay foco', () => {
    const state = trackingMapState({ driver: null, delivery: null, road: [], follow: true, fit: null })
    expect(state.focus).toBeNull()
  })
})
