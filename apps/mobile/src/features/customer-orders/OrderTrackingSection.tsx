import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { MapState } from './map/document'
import { LeafletMap } from './map/LeafletMap'
import type { Coordinate } from './map/geo'
import { type TrackingSnapshot } from './tracking'
import { trackingMapState, type FitRequest } from './tracking-map'
import { useOrderTracking } from './use-order-tracking'

const noop = () => undefined
const NO_ROAD: Coordinate[] = []

/**
 * Live view of an order in progress: a map with the delivery point and the driver's last fresh position,
 * plus ETA, distance and stops before this order. The customer can center the map on the driver or on the
 * delivery point, or keep following the driver as the position updates.
 */
export function OrderTrackingSection({ orderId }: { orderId: string }) {
  const { snapshot, unavailable } = useOrderTracking(orderId)
  const [follow, setFollow] = useState(false)
  const [fit, setFit] = useState<FitRequest | null>(null)
  const driver = snapshot?.driverPosition ?? null
  const delivery = snapshot?.deliveryPoint ?? null
  const road = snapshot?.road ?? NO_ROAD
  const driverPoint = useMemo<Coordinate | null>(
    () => (driver === null ? null : { latitude: driver.latitude, longitude: driver.longitude }),
    [driver],
  )
  const mapState = useMemo<MapState>(
    () => trackingMapState({ driver: driverPoint, delivery, road, follow, fit }),
    [driverPoint, delivery, road, follow, fit],
  )

  // Cada toque manda una clave nueva: el mapa reencuadra aunque el punto sea el mismo que antes.
  const center = (points: Coordinate[]) => {
    setFit((previous) => ({ points, key: String((previous === null ? 0 : Number(previous.key)) + 1) }))
  }

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
      {driver !== null || delivery !== null ? (
        <>
          <View style={styles.controls}>
            <MapButton
              label="Centrar en repartidor"
              disabled={driverPoint === null}
              onPress={() => { if (driverPoint !== null) center([driverPoint]) }}
            />
            <MapButton
              label="Centrar en mi punto"
              disabled={delivery === null}
              onPress={() => { if (delivery !== null) center([delivery]) }}
            />
            <MapButton
              label="Seguir repartidor"
              pressed={follow}
              disabled={driverPoint === null}
              onPress={() => { setFollow((on) => !on) }}
            />
          </View>
          <LeafletMap onPick={noop} state={mapState} style={styles.map} />
        </>
      ) : null}
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

interface MapButtonProps {
  label: string
  disabled: boolean
  /** Solo para el boton de seguimiento: indica si el modo esta activo. */
  pressed?: boolean
  onPress: () => void
}

function MapButton({ label, disabled, pressed, onPress }: MapButtonProps) {
  const toggle = pressed !== undefined
  return (
    <Pressable
      accessibilityRole={toggle ? 'switch' : 'button'}
      accessibilityLabel={label}
      accessibilityState={toggle ? { checked: pressed, disabled } : { disabled }}
      // RN-web no traduce accessibilityState.checked a aria-checked para el rol switch: se pasa directo.
      aria-checked={toggle ? pressed : undefined}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.control,
        pressed === true && styles.controlOn,
        disabled && styles.controlOff,
        isPressed && !disabled && styles.controlPressed,
      ]}
    >
      <Text style={[styles.controlText, pressed === true && styles.controlTextOn]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  control: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surfaceContainer },
  controlOn: { backgroundColor: colors.primary },
  controlOff: { opacity: 0.4 },
  controlPressed: { opacity: 0.8 },
  controlText: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant },
  controlTextOn: { color: colors.onPrimary },
  box: { backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 12, gap: 4 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  value: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  text: { fontSize: 14, color: colors.onSurface },
  muted: { fontSize: 13, color: colors.onSurfaceVariant },
  map: { height: 220, width: '100%', borderRadius: 10, overflow: 'hidden', marginTop: 6 },
})
