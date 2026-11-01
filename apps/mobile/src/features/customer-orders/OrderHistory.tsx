import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { colors } from '../../theme/colors'
import { StatusPill } from './OrderParts'
import { filterOrders, formatWindow, orderCode, orderStatuses, orderStatusLabels, type CustomerOrder, type OrderStatus } from './types'

/** History list with text search and a status filter. */
export function OrderHistory({ orders }: { orders: readonly CustomerOrder[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const visible = useMemo(() => filterOrders(orders, query, status), [orders, query, status])

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading} accessibilityRole="header">
        Historial de pedidos
      </Text>
      <TextInput
        accessibilityLabel="Buscar pedidos"
        placeholder="Buscar por dirección o código"
        placeholderTextColor={colors.outline}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        style={styles.search}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {(['ALL', ...orderStatuses] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: status === value }}
            onPress={() => {
              setStatus(value)
            }}
            style={[styles.chip, status === value ? styles.chipOn : null]}
          >
            <Text style={[styles.chipText, status === value ? styles.chipTextOn : null]}>{value === 'ALL' ? 'Todos' : orderStatusLabels[value]}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {visible.length === 0 ? (
        <Text style={styles.empty}>{orders.length === 0 ? 'Aún no tienes pedidos.' : 'Ningún pedido coincide con tu búsqueda.'}</Text>
      ) : (
        visible.map((order) => (
          <Pressable
            key={order.id}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalle del pedido ${orderCode(order.id)}`}
            onPress={() => {
              router.push({ pathname: '/mis-pedidos/[id]', params: { id: order.id } })
            }}
            style={styles.row}
          >
            <View style={styles.rowTop}>
              <Text style={styles.code}>{orderCode(order.id)}</Text>
              <StatusPill status={order.status} />
            </View>
            <Text style={styles.address} numberOfLines={2}>
              {order.address}
            </Text>
            <Text style={styles.meta}>
              {order.deliveryDate} · {formatWindow(order.windowStart, order.windowEnd)}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  heading: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  search: { minHeight: 44, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: 12, paddingHorizontal: 12, backgroundColor: colors.surfaceContainerLowest, color: colors.onSurface },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.surfaceContainerLowest },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.onSurface },
  chipTextOn: { color: colors.onPrimary, fontWeight: '700' },
  empty: { color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 16 },
  row: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 14, padding: 12, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontWeight: '700', color: colors.onSurface },
  address: { color: colors.onSurface },
  meta: { fontSize: 12, color: colors.onSurfaceVariant },
})
