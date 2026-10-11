import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Button } from '../../../components/Button'
import { isDemoMode } from '../../../api/config'
import { CurrentOrderCard } from '../../../features/customer-orders/CurrentOrderCard'
import { useMyOrders } from '../../../features/customer-orders/hooks'
import { OrderHistory } from '../../../features/customer-orders/OrderHistory'
import { pickCurrentOrder } from '../../../features/customer-orders/types'
import { useOrdersStore } from '../../../features/customer-orders/orders-store'
import { useSessionStore } from '../../../store/session-store'
import { colors } from '../../../theme/colors'

export default function MyOrdersScreen() {
  const { orders, loading, refreshing, error, unavailable, load } = useMyOrders()
  const user = useSessionStore((s) => s.user)
  const clear = useSessionStore((s) => s.clear)
  const current = pickCurrentOrder(orders)

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void load('refresh') }} />}
    >
      <View style={styles.top}>
        <Text style={styles.hello}>Hola{user ? `, ${user.fullName}` : ''}</Text>
        {isDemoMode() ? <Text style={styles.demo}>DEMO · datos simulados</Text> : null}
      </View>
      <Button label="Hacer nuevo pedido" disabled={unavailable} onPress={() => { router.push('/mis-pedidos/nuevo') }} />

      {loading ? <Text style={styles.info}>Cargando pedidos…</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {unavailable ? error : `No pudimos cargar tus pedidos. ${error}`}
        </Text>
      ) : null}
      {!loading && !error && current === null ? <Text style={styles.info}>No tienes ningún pedido en curso.</Text> : null}
      {current ? <CurrentOrderCard order={current} /> : null}
      {!unavailable && !loading ? <OrderHistory orders={orders} /> : null}

      <Button
        label="Cerrar sesión"
        variant="outline"
        onPress={() => {
          useOrdersStore.getState().reset()
          void clear()
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  top: { gap: 4 },
  hello: { fontSize: 20, fontWeight: '700', color: colors.onSurface },
  demo: { alignSelf: 'flex-start', backgroundColor: '#fff3cd', color: '#664d03', fontWeight: '700', fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  info: { color: colors.onSurfaceVariant, textAlign: 'center' },
  error: { color: colors.onErrorContainer, backgroundColor: colors.errorContainer, borderRadius: 10, padding: 12 },
})
