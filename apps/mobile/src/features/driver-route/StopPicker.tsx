import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { RouteStop } from './types'

interface StopPickerProps {
  /** Active orders in the order the driver attends them (pinned first, then the optimal route). */
  stops: readonly RouteStop[]
  currentId: string | undefined
  /** Re-centers the map on this order and the one after it. */
  onFocus: (stopId: string) => void
  /** Makes this order the one to attend first. */
  onAttend: (stopId: string) => void
}

/** Every active order of the driver, so the driver can re-center on one or choose which to attend first. */
export function StopPicker({ stops, currentId, onFocus, onAttend }: StopPickerProps) {
  if (stops.length === 0) return null
  return (
    <View style={styles.list} accessibilityLabel="Pedidos activos">
      {stops.map((stop, index) => {
        const isCurrent = stop.id === currentId
        return (
          <View key={stop.id} style={styles.row}>
            <View style={styles.index}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={styles.text}>
              <Text numberOfLines={1} style={styles.address}>{stop.address}</Text>
              {isCurrent ? <Text style={styles.current}>Atendiendo ahora</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver ${stop.address} en el mapa`}
              onPress={() => { onFocus(stop.id) }}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <Ionicons name="locate-outline" size={16} color={colors.primary} />
            </Pressable>
            {isCurrent ? null : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Atender primero ${stop.address}`}
                onPress={() => { onAttend(stop.id) }}
                style={({ pressed }) => [styles.attend, pressed && styles.pressed]}
              >
                <Text style={styles.attendText}>Atender primero</Text>
              </Pressable>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: 8, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  index: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  text: { flex: 1, gap: 2 },
  address: { fontSize: 13, color: colors.onSurface },
  current: { fontSize: 11, fontWeight: '700', color: colors.onSecondaryContainer },
  action: { padding: 6, borderRadius: 999, backgroundColor: colors.surfaceContainer },
  attend: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.secondary },
  attendText: { fontSize: 11, fontWeight: '700', color: colors.onSecondary },
  pressed: { opacity: 0.85 },
})
