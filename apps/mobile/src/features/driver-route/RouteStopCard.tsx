import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { colors } from '../../theme/colors'
import {
  canRegisterResult,
  notDeliveredReasons,
  reasonLabels,
  validateStopResult,
  type NotDeliveredReason,
  type RouteStop,
  type StopResultInput,
} from './types'

const statusLabel: Record<RouteStop['status'], string> = {
  PENDING: 'Pendiente',
  DELIVERED: 'Entregado',
  NOT_DELIVERED: 'No entregado',
}

interface Props {
  stop: RouteStop
  onSubmit: (stopId: string, input: StopResultInput) => Promise<void>
}

/** One stop: address, window and the result buttons while it is pending. */
export function RouteStopCard({ stop, onSubmit }: Props) {
  const [choosingReason, setChoosingReason] = useState(false)
  const [reason, setReason] = useState<NotDeliveredReason | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const pending = canRegisterResult(stop)

  const send = async (input: StopResultInput) => {
    const invalid = validateStopResult(input)
    if (invalid !== null) {
      setLocalError(invalid)
      return
    }
    setLocalError(null)
    await onSubmit(stop.id, input)
    setChoosingReason(false)
    setReason(null)
  }

  return (
    <View style={styles.card} accessibilityLabel={`Parada ${stop.sequence}, ${statusLabel[stop.status]}`}>
      <View style={styles.header}>
        <Text style={styles.sequence}>{stop.sequence}</Text>
        <View style={styles.headerText}>
          <Text style={styles.address}>{stop.address}</Text>
          <Text style={styles.window}>Ventana {stop.windowStart} – {stop.windowEnd}</Text>
        </View>
        <Text style={styles.status}>{statusLabel[stop.status]}</Text>
      </View>

      {stop.reason !== null ? <Text style={styles.info}>Motivo: {reasonLabels[stop.reason]}</Text> : null}

      {pending && !choosingReason ? (
        <View style={styles.actions}>
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
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sequence: { fontWeight: '800', fontSize: 18, color: colors.primary, width: 24, textAlign: 'center' },
  headerText: { flex: 1, gap: 2 },
  address: { fontWeight: '600', color: colors.onSurface },
  window: { color: colors.onSurfaceVariant, fontSize: 12 },
  status: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant },
  info: { color: colors.onSurfaceVariant },
  actions: { gap: 8 },
  reasons: { gap: 8 },
  reason: { borderWidth: 1, borderColor: colors.outline, borderRadius: 10, padding: 10 },
  reasonSelected: { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
  reasonText: { color: colors.onSurface },
  error: { color: colors.onErrorContainer, backgroundColor: colors.errorContainer, borderRadius: 10, padding: 10 },
})
