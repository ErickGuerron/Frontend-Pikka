import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { notificationDetail, notificationTitle, type CustomerNotification } from './notifications'

interface Props {
  notifications: CustomerNotification[]
}

/** Notices about the customer's orders and balance. Presentational: with none, it takes up no space. */
export function NotificationsPanel({ notifications }: Props) {
  if (notifications.length === 0) return null

  return (
    <View accessibilityLabel="Avisos de tus pedidos" style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>Avisos</Text>
      {notifications.map((n) => {
        const detail = notificationDetail(n)
        return (
          <View key={n.id} style={styles.item}>
            <Text style={styles.title}>{notificationTitle(n.kind)}</Text>
            {detail !== '' ? <Text style={styles.detail}>{detail}</Text> : null}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  heading: { fontSize: 15, fontWeight: '700', color: colors.primary },
  item: {
    gap: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cce7ea',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  title: { fontSize: 14, fontWeight: '600', color: colors.primary },
  detail: { fontSize: 12, color: '#475569' },
})
