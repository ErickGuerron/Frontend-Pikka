import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { type TrackingSnapshot } from './tracking'
import { useOrderTracking } from './use-order-tracking'

/** Live delivery estimate for an order in progress: ETA, distance and stops before this order. */
export function OrderTrackingSection({ orderId }: { orderId: string }) {
  const { snapshot, unavailable } = useOrderTracking(orderId)

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
})
