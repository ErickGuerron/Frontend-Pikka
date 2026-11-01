import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { Coordinate } from '../customer-orders/map/geo'
import { formatDistance, paginate, SORT_LABELS, sortStops, stopDistance, type StopSort } from './stop-sort'
import type { RouteStop } from './types'

interface StopPickerModalProps {
  visible: boolean
  /** Active orders in the order the driver attends them (pinned first, then the optimal route). */
  stops: readonly RouteStop[]
  currentId: string | undefined
  /** The driver's last position; without it "Más cercanas" falls back to the route order. */
  driver: Coordinate | null
  onClose: () => void
  /** Re-centers the map on this order and the driver. */
  onFocus: (stopId: string) => void
  /** Makes this order the one to attend first. */
  onAttend: (stopId: string) => void
}

const SORTS: StopSort[] = ['route', 'nearest', 'waiting', 'deadline']

/**
 * Picker opened by "Re-encuadrar": every active order, 5 per page, sortable by route, distance, waiting time
 * or deadline. Tapping an order centers the map on it; "Atender primero" makes it the current one.
 */
export function StopPickerModal({ visible, stops, currentId, driver, onClose, onFocus, onAttend }: StopPickerModalProps) {
  const [sort, setSort] = useState<StopSort>('route')
  const [page, setPage] = useState(0)
  useEffect(() => { if (visible) setPage(0) }, [visible, sort])

  const sorted = useMemo(() => sortStops(stops, sort, driver), [stops, sort, driver])
  const view = paginate(sorted, page)

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet} accessibilityLabel="Pedidos activos">
          <View style={styles.head}>
            <Text style={styles.title}>¿Qué pedido quieres ver?</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sorts}>
            {SORTS.map((option) => {
              const disabled = option === 'nearest' && driver === null
              const selected = option === sort
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={`Ordenar por ${SORT_LABELS[option]}`}
                  accessibilityState={{ selected, disabled }}
                  disabled={disabled}
                  onPress={() => { setSort(option) }}
                  style={[styles.sort, selected && styles.sortSelected, disabled && styles.off]}
                >
                  <Text style={[styles.sortText, selected && styles.sortTextSelected]}>{SORT_LABELS[option]}</Text>
                </Pressable>
              )
            })}
          </ScrollView>

          {view.items.map((stop) => {
            const isCurrent = stop.id === currentId
            const distance = stopDistance(stop, driver)
            return (
              <View key={stop.id} style={styles.row}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ver ${stop.address} en el mapa`}
                  onPress={() => { onFocus(stop.id); onClose() }}
                  style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
                >
                  <Ionicons name="home" size={18} color={colors.primary} />
                  <View style={styles.text}>
                    <Text numberOfLines={1} style={styles.address}>{stop.address}</Text>
                    <Text style={styles.meta}>
                      {`${stop.windowStart}–${stop.windowEnd}`}{distance === null ? '' : ` · ${formatDistance(distance)}`}
                    </Text>
                    {isCurrent ? <Text style={styles.current}>Atendiendo ahora</Text> : null}
                  </View>
                </Pressable>
                {isCurrent ? null : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Atender primero ${stop.address}`}
                    onPress={() => { onAttend(stop.id); onClose() }}
                    style={({ pressed }) => [styles.attend, pressed && styles.pressed]}
                  >
                    <Text style={styles.attendText}>Atender primero</Text>
                  </Pressable>
                )}
              </View>
            )
          })}
          {view.items.length === 0 ? <Text style={styles.meta}>No hay pedidos activos.</Text> : null}

          <View style={styles.pager}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Página anterior"
              accessibilityState={{ disabled: view.page === 0 }}
              disabled={view.page === 0}
              onPress={() => { setPage(view.page - 1) }}
              style={[styles.pageBtn, view.page === 0 && styles.off]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
            </Pressable>
            <Text style={styles.pageText}>{`Página ${String(view.page + 1)} de ${String(view.pages)}`}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Página siguiente"
              accessibilityState={{ disabled: view.page >= view.pages - 1 }}
              disabled={view.page >= view.pages - 1}
              onPress={() => { setPage(view.page + 1) }}
              style={[styles.pageBtn, view.page >= view.pages - 1 && styles.off]}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(29,52,57,0.4)', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700', color: colors.onSurface },
  close: { padding: 6, borderRadius: 999, backgroundColor: colors.surfaceContainer },
  sorts: { gap: 6 },
  sort: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surfaceContainer },
  sortSelected: { backgroundColor: colors.secondary },
  sortText: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant },
  sortTextSelected: { color: colors.onSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  text: { flex: 1, gap: 1 },
  address: { fontSize: 13, color: colors.onSurface },
  meta: { fontSize: 11, color: colors.onSurfaceVariant },
  current: { fontSize: 11, fontWeight: '700', color: colors.onSecondaryContainer },
  attend: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.secondary },
  attendText: { fontSize: 11, fontWeight: '700', color: colors.onSecondary },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 4 },
  pageBtn: { padding: 6, borderRadius: 999, backgroundColor: colors.surfaceContainer },
  pageText: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant },
  off: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
})
