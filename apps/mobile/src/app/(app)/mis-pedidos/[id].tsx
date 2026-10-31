import { ScrollView, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { CurrentOrderCard } from '../../../features/customer-orders/CurrentOrderCard'
import { useMyBalance } from '../../../features/customer-orders/balance-hooks'
import { useMyOrders } from '../../../features/customer-orders/hooks'

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { orders, loading } = useMyOrders()
  const { balance } = useMyBalance()
  const order = orders.find((o) => o.id === id)

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {order ? <CurrentOrderCard order={order} cancelBlocked={balance?.blocked === true} /> : <Text>{loading ? 'Cargando…' : 'No encontramos este pedido.'}</Text>}
    </ScrollView>
  )
}
