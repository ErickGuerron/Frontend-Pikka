import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { MapState } from './map/document'
import { LeafletMap } from './map/LeafletMap'
import type { Coordinate } from './map/geo'
import { type TrackingSnapshot } from './tracking'
import { useOrderTracking } from './use-order-tracking'

const noop = () => undefined
const NO_ROAD: Coordinate[] = []

/**
 * Live view of an order in progress: a map with the delivery point and the driver's last fresh position,
 * plus ETA, distance and stops before this order.
 */
export function OrderTrackingSection({ orderId }: { orderId: string }) {
  const { snapshot, unavailable } = useOrderTracking(orderId)
  const driver = snapshot?.driverPosition ?? null
  const delivery = snapshot?.deliveryPoint ?? null
  const road = snapshot?.road ?? NO_ROAD
  const mapState = useMemo<MapState>(
    () => ({
      zones: [],
      picked: null,
      delivery,
      // With the driver on the map the view fits both points; centering on the house alone would hide the driver.
      focus: driver === null ? delivery : null,
      highlightId: null,
      driver: driver === null ? null : { latitude: driver.latitude, longitude: driver.longitude },
      road,
    }),
    [delivery, driver, road],
  )

  if (unavailable) {
    return <Text style={styles.muted}>Seguimiento no disponible en este momento.</Text>
  }
  if (snapshot === null) {
    return <Text style={styles.muted}>Conectando con el seguimiento...</Text>
  }
  return (
    <View accessibilityLabel="Seguimiento en vivo" style={styles.box}>
      <Text style={styles.label}>Seguimiento</Text>
      <Text style={styles.value}>{etaText(snapshot)}</Text>
      {snapshot.stopsBefore !== null ? <Text style={styles.text}>{stopsText(snapshot.stopsBefore)}</Text> : null}
      {driver !== null && snapshot.eta === null ? (
        <Text style={styles.text}>Repartidor en camino. Sin tiempo estimado por ahora.</Text>
      ) : null}
      {driver !== null || delivery !== null ? <LeafletMap onPick={noop} state={mapState} style={styles.map} /> : null}
    </View>
  )
}

export function etaText(snapshot: TrackingSnapshot): string {
  if (snapshot.eta === null) return 'Tiempo estimado no disponible'
  const minutes = Math.max(1, Math.round(snapshot.eta.durationSeconds / 60))
  const km = (snapshot.eta.distanceMeters / 1000).toFixed(1)
  return `Llega en unos ${minutes} min (${km} km)`
}

export function stopsText(stopsBefore: number): string {
  if (stopsBefore === 0) return 'Eres la siguiente parada.'
  if (stopsBefore === 1) return '1 parada antes que la tuya.'
  return `${stopsBefore} paradas antes que la tuya.`
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 12, gap: 4 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  value: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  text: { fontSize: 14, color: colors.onSurface },
  muted: { fontSize: 13, color: colors.onSurfaceVariant },
  map: { height: 220, width: '100%', borderRadius: 10, overflow: 'hidden', marginTop: 6 },
})
