import { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { isDemoMode } from '../../api/config'
import { ApiError, userMessage } from '../../api/errors'
import { Button } from '../../components/Button'
import { colors } from '../../theme/colors'
import { OrderStepper, StatusPill } from './OrderParts'
import { OrderTrackingSection } from './OrderTrackingSection'
import { useOrdersStore } from './orders-store'
import { canCancel, formatWindow, isInProgress, orderCode, pendingDriverNotice, reviewReasonLabels, type CustomerOrder } from './types'

/** What the customer sees when an account blocked for the balance cannot cancel (ADR 0006). */
export const cancelBlockedMessage = 'Paga tu saldo pendiente para volver a cancelar pedidos.'

/**
 * The order in focus: status, stepper, delivery details and (when allowed) cancel. No map in this build.
 * `cancelBlocked` is true while the account is blocked for the balance: the server refuses the cancel with 403.
 */
export function CurrentOrderCard({ order, cancelBlocked = false }: { order: CustomerOrder; cancelBlocked?: boolean }) {
  const cancel = useOrdersStore((s) => s.cancel)
  const [busy, setBusy] = useState(false)

  const confirmCancel = () => {
    Alert.alert('Cancelar pedido', `¿Seguro que quieres cancelar el pedido ${orderCode(order.id)}?`, [
      { text: 'Conservar pedido', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: () => {
          setBusy(true)
          cancel(order.id)
            .catch((error: unknown) => {
              Alert.alert('No se pudo cancelar', error instanceof ApiError && error.status === 403 ? cancelBlockedMessage : userMessage(error))
            })
            .finally(() => {
              setBusy(false)
            })
        },
      },
    ])
  }

  return (
    <View style={styles.card} accessibilityLabel="Pedido en curso">
      <View style={styles.header}>
        <Text style={styles.title}>
          {isInProgress(order.status) ? 'Pedido en curso' : 'Detalle del pedido'} <Text style={styles.code}>{orderCode(order.id)}</Text>
        </Text>
        <StatusPill status={order.status} />
      </View>

      {pendingDriverNotice(order.status, order.queuePosition) !== null ? (
        <View accessibilityRole="summary" style={styles.banner} accessibilityLabel="Pedido en espera de repartidor">
          <Text style={styles.bannerText}>{pendingDriverNotice(order.status, order.queuePosition)}</Text>
        </View>
      ) : null}

      {order.status === 'PENDING_REVIEW' ? (
        <View accessibilityRole="summary" style={styles.banner}>
          <Text style={styles.bannerTitle}>Tu pedido está en revisión por un operador.</Text>
          <Text style={styles.bannerText}>Lo confirmaremos o te pediremos ajustar los datos. No necesitas hacer nada por ahora.</Text>
          {order.reviewReasons.length > 0 ? (
            <Text style={styles.bannerText}>Motivo: {order.reviewReasons.map((r) => reviewReasonLabels[r]).join(', ')}.</Text>
          ) : null}
        </View>
      ) : (
        <OrderStepper status={order.status} />
      )}

      <View>
        <Text style={styles.label}>Entrega</Text>
        <Text style={styles.value}>
          {order.deliveryDate} · {formatWindow(order.windowStart, order.windowEnd)}
        </Text>
      </View>
      <View>
        <Text style={styles.label}>Dirección de entrega</Text>
        <Text style={styles.text}>{order.address}</Text>
      </View>
      {isInProgress(order.status) && !isDemoMode() ? <OrderTrackingSection orderId={order.id} /> : null}
      {canCancel(order.status) ? (
        <>
          <Button label="Cancelar pedido" variant="danger" onPress={confirmCancel} loading={busy} disabled={cancelBlocked} />
          {cancelBlocked ? <Text style={styles.blockedNote}>{cancelBlockedMessage}</Text> : null}
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 20, padding: 16, gap: 14, elevation: 2 },
  header: { gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  code: { fontSize: 15, color: colors.onSurfaceVariant, fontWeight: '500' },
  blockedNote: { fontSize: 12, color: colors.onSurfaceVariant },
  banner: { backgroundColor: '#fff8e1', borderRadius: 10, padding: 12, gap: 2 },
  bannerTitle: { fontWeight: '700', color: '#664d03' },
  bannerText: { color: '#664d03', fontSize: 13 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  value: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  text: { fontSize: 15, color: colors.onSurface },
})
