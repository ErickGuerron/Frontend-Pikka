import { routeMapState } from '../src/features/driver-route/map-state'

const stopA = { latitude: -0.18, longitude: -78.47 }
const stopB = { latitude: -0.19, longitude: -78.46 }
const driver = { latitude: -0.175, longitude: -78.48 }

describe('routeMapState', () => {
  it('pone al repartidor en el mapa de la ruta junto a las paradas en orden', () => {
    const state = routeMapState([stopA, stopB], driver)

    expect(state.driver).toEqual(driver)
    expect(state.stops).toEqual([stopA, stopB])
  })

  it('no dibuja repartidor mientras no hay una posición compartida', () => {
    expect(routeMapState([stopA], null).driver).toBeNull()
  })

  it('una ruta no tiene zonas, punto elegido ni foco', () => {
    expect(routeMapState([stopA], driver)).toMatchObject({ zones: [], picked: null, focus: null, highlightId: null })
  })
})
