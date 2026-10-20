import { Ionicons } from '@expo/vector-icons'
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useMemo, type ReactNode } from 'react'
import { LeafletMap } from '../customer-orders/map/LeafletMap'
import type { Coordinate } from '../customer-orders/map/geo'
import { colors } from '../../theme/colors'
import { routeMapState } from './map-state'
import { useStopPoints } from './stop-points'
import { isFinal, type RouteStop } from './types'

interface KpiProps {
  label: string
  value: number
  unit: string
  accent: string
  icon: ReactNode
}

function Kpi({ label, value, unit, accent, icon }: KpiProps) {
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiBar, { backgroundColor: accent }]} />
      <View style={styles.kpiHead}>
        <Text style={styles.kpiLabel}>{label}</Text>
        {icon}
      </View>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      <Text style={styles.kpiUnit}>{unit}</Text>
    </View>
  )
}

/** The three counters of the day, computed from the route (nothing here is invented). */
export function RouteKpis({ stops }: { stops: readonly RouteStop[] }) {
  const done = stops.filter((s) => isFinal(s.status)).length
  return (
    <View style={styles.kpis}>
      <Kpi label="Pendientes" value={stops.length - done} unit="paradas" accent={colors.primaryContainer} icon={<Image accessibilityLabel="Pikka" source={require('../../../assets/pikka.png')} style={styles.otter} resizeMode="contain" />} />
      <Kpi label="Listos" value={done} unit="hoy" accent={colors.secondary} icon={<Ionicons name="checkmark-circle" size={16} color={colors.secondary} />} />
      <Kpi label="Total" value={stops.length} unit="en la ruta" accent={colors.onSecondaryContainer} icon={<Ionicons name="list" size={16} color={colors.onSecondaryContainer} />} />
    </View>
  )
}

/** Google Maps directions through the pending stops, in route order. Addresses only: no coordinates are stored. */
export function externalRouteUrl(pending: readonly RouteStop[]): string | null {
  const addresses = pending.map((s) => s.address)
  const destination = addresses[addresses.length - 1]
  if (destination === undefined) return null
  const waypoints = addresses.slice(0, -1)
  const params = [
    'api=1',
    `destination=${encodeURIComponent(destination)}`,
    ...(waypoints.length > 0 ? [`waypoints=${encodeURIComponent(waypoints.join('|'))}`] : []),
  ]
  return `https://www.google.com/maps/dir/?${params.join('&')}`
}

const ignore = () => undefined

interface RouteCardProps {
  stops: readonly RouteStop[]
  driver?: Coordinate | null
  /** Pending stops in the order the driver attends them (optimal order); defaults to route order. */
  ordered?: readonly RouteStop[]
  /** Optimal road by streets, drawn under the stops. */
  road?: Coordinate[]
  /** Re-center request: the map fits these points each time `key` changes. */
  fit?: { points: Coordinate[]; key: string } | null
  onRecenter?: () => void
}

/** Route card with the pending count, the driver's position, the optimal road and the one-tap launch of the external GPS. */
export function RouteCard({ stops, driver = null, ordered, road = [], fit = null, onRecenter }: RouteCardProps) {
  const pending = stops.filter((s) => !isFinal(s.status))
  const url = externalRouteUrl(pending)
  const numbered = ordered ?? pending
  const points = useStopPoints(numbered)
  const mapState = useMemo(
    () => routeMapState(points, driver, { road, fit: fit?.points ?? null, fitKey: fit?.key }),
    [points, driver, road, fit],
  )
  const canRecenter = onRecenter !== undefined && points.length > 0
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>Ruta de hoy</Text>
        <Text style={styles.chip}>{pending.length} por entregar</Text>
      </View>
      <LeafletMap state={mapState} onPick={ignore} style={styles.map} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Re-encuadrar en el pedido y el siguiente punto"
        accessibilityState={{ disabled: !canRecenter }}
        disabled={!canRecenter}
        onPress={() => { onRecenter?.() }}
        style={({ pressed }) => [styles.recenter, !canRecenter && styles.off, pressed && styles.pressed]}
      >
        <Ionicons name="locate" size={18} color={colors.primary} />
        <Text style={styles.recenterText}>Re-encuadrar</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir ruta completa en el navegador GPS"
        accessibilityState={{ disabled: url === null }}
        disabled={url === null}
        onPress={() => { if (url !== null) void Linking.openURL(url) }}
        style={({ pressed }) => [styles.gps, url === null && styles.off, pressed && styles.pressed]}
      >
        <Ionicons name="navigate" size={18} color={colors.onSecondary} />
        <Text style={styles.gpsText}>Abrir ruta en el GPS</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  kpis: { flexDirection: 'row', gap: 10 },
  kpi: { flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, paddingVertical: 14, paddingRight: 12, paddingLeft: 16, gap: 2, overflow: 'hidden' },
  kpiBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  otter: { width: 22, height: 22 },
  kpiHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiLabel: { fontSize: 12, color: colors.onSurfaceVariant },
  kpiValue: { fontSize: 24, fontWeight: '700', marginTop: 6 },
  kpiUnit: { fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, gap: 8 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.primary },
  chip: { fontSize: 12, color: colors.onSurfaceVariant, backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  map: { height: 200, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.surfaceContainer },
  gps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.secondary, borderRadius: 8, paddingVertical: 10 },
  gpsText: { color: colors.onSecondary, fontWeight: '600', fontSize: 14 },
  recenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surfaceContainer, borderRadius: 8, paddingVertical: 10 },
  recenterText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  off: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
})
