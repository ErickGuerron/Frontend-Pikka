import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { colors } from '../../theme/colors'
import { captureDriverLocation, LOCATION_DENIED_MESSAGE, type DriverLocation } from './location'
import {
  canRegisterResult,
  nextProgressStatus,
  notDeliveredReasons,
  reasonLabels,
  validateStopResult,
  type NotDeliveredReason,
  type ProgressStatus,
  type RouteStop,
  type StopResultInput,
} from './types'

const statusLabel: Record<RouteStop['status'], string> = {
  PENDING: 'Pendiente',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  NOT_DELIVERED: 'No entregado',
}

/** Button text for the next progress step. */
const advanceLabel: Record<ProgressStatus, string> = {
  PICKED_UP: 'Marcar recogido',
  IN_TRANSIT: 'Marcar en camino',
}

interface Props {
  stop: RouteStop
  /** Total stops in the route, for the "Parada n de total" badge. */
  total?: number
  /** The stop being worked on shows its actions; the next ones stay muted. */
  current?: boolean
  onSubmit: (stopId: string, input: StopResultInput) => Promise<void>
  onAdvance: (stopId: string, to: ProgressStatus) => Promise<void>
}

/** One stop: address, window, progress buttons and the result buttons while it is not final. */
export function RouteStopCard({ stop, total, current = true, onSubmit, onAdvance }: Props) {
  const [choosingReason, setChoosingReason] = useState(false)
  const [reason, setReason] = useState<NotDeliveredReason | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const pending = canRegisterResult(stop) && current
  const next = nextProgressStatus(stop)

  /** Registers a result. The GPS position is taken now, at the moment of the result. */
  const send = async (input: Omit<StopResultInput, 'location'>) => {
    const invalid = validateStopResult(input)
    if (invalid !== null) {
      setLocalError(invalid)
      return
    }
    setLocalError(null)
    let location: DriverLocation
    try {
      location = await captureDriverLocation()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : LOCATION_DENIED_MESSAGE)
      return
    }
    await onSubmit(stop.id, { ...input, location })
    setChoosingReason(false)
    setReason(null)
  }

  return (
    <View style={[styles.card, !current && styles.cardMuted]} accessibilityLabel={`Parada ${stop.sequence}, ${statusLabel[stop.status]}`}>
      <View style={[styles.bar, current ? styles.barCurrent : styles.barMuted]} />
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.badges}>
            <Text style={[styles.badge, current && styles.badgeCurrent]}>
              {total === undefined ? `Parada ${String(stop.sequence)}` : `Parada ${String(stop.sequence)} de ${String(total)}`}
            </Text>
            <Text style={styles.status}>{statusLabel[stop.status]}</Text>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={14} color={current ? colors.secondary : colors.onSurfaceVariant} />
            <Text style={styles.address}>{stop.address}</Text>
          </View>
          <Text style={styles.window}>Ventana {stop.windowStart} – {stop.windowEnd}</Text>
        </View>
      </View>

      {stop.reason !== null ? <Text style={styles.info}>Motivo: {reasonLabels[stop.reason]}</Text> : null}

      {pending && !choosingReason ? (
        <View style={styles.actions}>
          {next !== null ? (
            <Button label={advanceLabel[next]} onPress={() => { void onAdvance(stop.id, next) }} />
          ) : null}
          <Button label="Entregado" onPress={() => { void send({ outcome: 'DELIVERED' }) }} />
          <Button label="No entregado" variant="outline" onPress={() => { setChoosingReason(true) }} />
        </View>
      ) : null}

      {pending && choosingReason ? (
        <View style={styles.reasons}>
          <Text style={styles.info}>¿Por qué no se entregó?</Text>
          {notDeliveredReasons.map((r) => (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ selected: reason === r }}
              onPress={() => { setReason(r) }}
              style={[styles.reason, reason === r ? styles.reasonSelected : null]}
            >
              <Text style={styles.reasonText}>{reasonLabels[r]}</Text>
            </Pressable>
          ))}
          <Button
            label="Confirmar no entregado"
            disabled={reason === null}
            onPress={() => { if (reason !== null) void send({ outcome: 'NOT_DELIVERED', reason }) }}
          />
          <Button label="Volver" variant="outline" onPress={() => { setChoosingReason(false); setReason(null) }} />
        </View>
      ) : null}

      {localError !== null ? (
        <Text accessibilityRole="alert" style={styles.error}>{localError}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, paddingLeft: 20, gap: 10, overflow: 'hidden' },
  cardMuted: { opacity: 0.85 },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  barCurrent: { backgroundColor: colors.secondary },
  barMuted: { backgroundColor: colors.surfaceVariant },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { flex: 1, gap: 4 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  badgeCurrent: { color: colors.onSecondaryContainer, backgroundColor: colors.secondaryContainer },
  status: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { flex: 1, fontWeight: '600', fontSize: 15, color: colors.onSurface },
  window: { color: colors.onSurfaceVariant, fontSize: 12 },
  info: { color: colors.onSurfaceVariant },
  actions: { gap: 8 },
  reasons: { gap: 8 },
  reason: { borderWidth: 1, borderColor: colors.outline, borderRadius: 10, padding: 10 },
  reasonSelected: { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
  reasonText: { color: colors.onSurface },
  error: { color: colors.onErrorContainer, backgroundColor: colors.errorContainer, borderRadius: 10, padding: 10 },
})
