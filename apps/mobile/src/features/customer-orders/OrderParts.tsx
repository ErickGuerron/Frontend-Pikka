import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { orderStatusLabels, progressIndex, progressSteps, type OrderStatus } from './types'

const pillColors: Record<OrderStatus, { bg: string; fg: string }> = {
  PENDING: { bg: colors.surfaceContainerHigh, fg: colors.onSurface },
  PENDING_REVIEW: { bg: '#fff3cd', fg: '#664d03' },
  ROUTE_ASSIGNED: { bg: colors.primaryFixed, fg: colors.onPrimaryFixed },
  PICKED_UP: { bg: colors.secondaryContainer, fg: colors.onSecondaryFixed },
  IN_TRANSIT: { bg: colors.secondaryContainer, fg: colors.onSecondaryFixed },
  DELIVERED: { bg: '#d1f0da', fg: '#14532d' },
  NOT_DELIVERED: { bg: colors.errorContainer, fg: colors.onErrorContainer },
  CANCELLED: { bg: colors.surfaceVariant, fg: colors.onSurfaceVariant },
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const c = pillColors[status]
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.fg }]}>{orderStatusLabels[status]}</Text>
    </View>
  )
}

/** Confirmado, Preparado, En camino, Entregado. Renders nothing when it does not apply. */
export function OrderStepper({ status }: { status: OrderStatus }) {
  const current = progressIndex(status)
  if (current < 0) return null
  const percent = Math.round((current / (progressSteps.length - 1)) * 100)
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Progreso del pedido"
      accessibilityValue={{ min: 0, max: 100, now: percent, text: progressSteps[current] ?? '' }}
      style={styles.stepper}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${String(percent)}%` as `${number}%` }]} />
      </View>
      <View style={styles.steps}>
        {progressSteps.map((label, index) => (
          <Text key={label} adjustsFontSizeToFit numberOfLines={1} style={[styles.step, index <= current ? styles.stepDone : null]}>
            {label.toUpperCase()}
          </Text>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  stepper: { gap: 6 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceContainer, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.secondary },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
    step: { flex: 1, textAlign: 'center', fontSize: 8, fontWeight: '700', color: colors.outline },
  stepDone: { color: colors.secondary },
})
