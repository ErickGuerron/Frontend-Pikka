import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { isDriverDemoMode } from '../../../api/config'
import { useSessionStore } from '../../../store/session-store'
import { colors } from '../../../theme/colors'
import type { Coordinate } from '../../../features/customer-orders/map/geo'
import { attendOrder, focusPoints } from '../../../features/driver-route/attend'
import { DriverHeader } from '../../../features/driver-route/DriverHeader'
import { useDriverRoute } from '../../../features/driver-route/hooks'
import { useDriverLocationReporter } from '../../../features/driver-route/location-reporter'
import { RouteStopCard } from '../../../features/driver-route/RouteStopCard'
import { pageStops } from '../../../features/driver-route/stop-list'
import { RouteCard, RouteKpis } from '../../../features/driver-route/RouteSummary'
import { StopPickerModal } from '../../../features/driver-route/StopPickerModal'
import { useRoutePlan } from '../../../features/driver-route/plan-hooks'
import { completedCount, isFinal, orderedStops, remainingCount, type RouteStop } from '../../../features/driver-route/types'

type Tab = 'active' | 'done'

const NO_ROAD: Coordinate[] = []

export default function DriverRouteScreen() {
  const { route, loading, error, unavailable, reload, submit, advance } = useDriverRoute()
  const user = useSessionStore((s) => s.user)
  const clear = useSessionStore((s) => s.clear)
  const [tab, setTab] = useState<Tab>('active')
  // Busqueda y pagina de la pestana visible. Cualquier cambio de pestana o de texto vuelve a la primera pagina.
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  // Pedido de encuadre: ids de los pedidos a mostrar en el mapa. Cada petición tiene su propio número.
  const [fitRequest, setFitRequest] = useState<{ ids: string[]; n: number } | null>(null)
  const stops = route === null ? [] : orderedStops(route.stops)
  // Sin ruta asignada el backend responde { id: "", stops: [] }: no es un error, es una vista vacía.
  const hasRoute = route !== null && route.id !== ''
  const active = stops.filter((s) => !isFinal(s.status))
  const done = stops.filter((s) => isFinal(s.status))
  // Comparte la posición con el cliente solo mientras hay paradas activas y la pantalla está abierta.
  const { tracking, position } = useDriverLocationReporter(hasRoute && active.length > 0)
  const activeKey = active.map((s) => s.id).join(',')
  const { plan, error: planError } = useRoutePlan(position, activeKey, hasRoute && active.length > 0)
  // Orden de atención: el pedido fijado primero, el resto por la ruta óptima del plan.
  const byId = new Map(active.map((s) => [s.id, s] as const))
  const attended: RouteStop[] = attendOrder(plan?.order ?? [], pinnedId, active.map((s) => s.id))
    .map((id) => byId.get(id))
    .filter((s): s is RouteStop => s !== undefined)
  const list = pageStops(tab === 'active' ? attended : done, query, page)
  const shown = list.items
  const searching = query.trim() !== ''
  const selectTab = (next: Tab) => {
    setTab(next)
    setPage(0)
  }
  const changeQuery = (text: string) => {
    setQuery(text)
    setPage(0)
  }
  const currentId = attended[0]?.id
  const fit = fitRequest === null
    ? null
    : { points: focusPoints(fitRequest.ids.map((id) => byId.get(id)).filter((s): s is RouteStop => s !== undefined), position), key: String(fitRequest.n) }
  const name = user?.fullName ?? ''

  const requestFit = (ids: string[]) => {
    setFitRequest((prev) => ({ ids, n: (prev?.n ?? 0) + 1 }))
  }
  // Re-encuadrar abre el selector: el repartidor elige qué pedido encuadrar.
  const recenterCurrent = () => { setPicking(true) }
  const focusOrder = (id: string) => { requestFit([id]) }

  return (
    <View style={styles.screen}>
      <DriverHeader name={name} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading && route !== null} onRefresh={() => { void reload() }} />}
      >
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.trim().charAt(0).toUpperCase() || 'P'}</Text>
          </View>
          <View style={styles.profileText}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} style={styles.name}>{name || 'Repartidor'}</Text>
              <View style={styles.badge}>
                <View style={styles.dot} />
                <Text style={styles.badgeText}>Activo</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              {route === null || !hasRoute
                ? (route === null ? 'Ruta de hoy' : 'Sin ruta asignada hoy')
                : `Ruta de hoy · ${completedCount(route.stops)} de ${route.stops.length} completadas · ${remainingCount(route.stops)} pendientes${route.maxOrders === null ? '' : ` · Cupo: ${route.stops.length} de ${route.maxOrders} pedidos`}`}
            </Text>
            {isDriverDemoMode() ? <Text style={styles.demo}>DEMO · datos simulados</Text> : null}
          </View>
        </View>

        <RouteKpis stops={stops} />
        <RouteCard
          stops={stops}
          driver={position}
          ordered={attended}
          road={plan?.geometry ?? NO_ROAD}
          fit={fit}
          onRecenter={recenterCurrent}
        />

        {tab === 'active' && planError !== null ? (
          <Text accessibilityRole="alert" style={styles.error}>
            No se pudo calcular la ruta óptima: {planError}. Revisa que el servicio de rutas esté levantado (make osrm-up).
          </Text>
        ) : null}

        {tracking === 'denied' ? (
          <Text accessibilityRole="alert" style={styles.error}>
            Tu ubicación está desactivada. El cliente no verá tu posición en el mapa.
          </Text>
        ) : null}
        {tracking === 'on' ? <Text style={styles.info}>Compartiendo tu ubicación con el cliente.</Text> : null}

        <View style={styles.tabs}>
          <TabButton label="Activos" count={active.length} selected={tab === 'active'} onPress={() => { selectTab('active') }} />
          <TabButton label="Completados" count={done.length} selected={tab === 'done'} onPress={() => { selectTab('done') }} />
        </View>

        <View style={styles.search}>
          <Ionicons name="search" size={16} color={colors.onSurfaceVariant} />
          <TextInput
            accessibilityLabel="Buscar parada por dirección"
            placeholder="Buscar por dirección"
            placeholderTextColor={colors.onSurfaceVariant}
            value={query}
            onChangeText={changeQuery}
            autoCorrect={false}
            style={styles.searchInput}
          />
          {searching ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => { changeQuery('') }}>
              <Ionicons name="close-circle" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          ) : null}
        </View>

        {loading && route === null ? <Text style={styles.info}>Cargando tu ruta…</Text> : null}
        {error !== null ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {!loading && route !== null && !hasRoute ? (
          <EmptyState title="Sin ruta asignada hoy" body="Cuando el despachador te asigne una ruta, aparecerá aquí." />
        ) : null}
        {!loading && hasRoute && list.total === 0 && searching && (tab === 'active' ? attended : done).length > 0 ? (
          <EmptyState title="Ninguna parada coincide" body="Revisa el texto buscado o limpia la búsqueda." />
        ) : null}
        {!loading && hasRoute && list.total === 0 && !searching ? (
          tab === 'active' ? (
            <EmptyState title="No tienes paradas activas" body="Todas tus paradas ya tienen resultado, o aún no tienes paradas asignadas." />
          ) : (
            <EmptyState title="Aún no completas paradas" body="Aquí aparecerán las paradas que entregues o no logres entregar." />
          )
        ) : null}

        {shown.map((stop) => (
          <RouteStopCard
            key={stop.id}
            stop={stop}
            total={stops.length}
            current={stop.id === currentId || isFinal(stop.status)}
            onSubmit={submit}
            onAdvance={advance}
          />
        ))}

        {list.pages > 1 ? (
          <View style={styles.pager}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Página anterior"
              accessibilityState={{ disabled: list.page === 0 }}
              disabled={list.page === 0}
              onPress={() => { setPage(list.page - 1) }}
              style={[styles.pageBtn, list.page === 0 && styles.off]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
            </Pressable>
            <Text style={styles.pageText}>{`Página ${String(list.page + 1)} de ${String(list.pages)}`}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Página siguiente"
              accessibilityState={{ disabled: list.page >= list.pages - 1 }}
              disabled={list.page >= list.pages - 1}
              onPress={() => { setPage(list.page + 1) }}
              style={[styles.pageBtn, list.page >= list.pages - 1 && styles.off]}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.secure}>
            <Ionicons name="shield-checkmark" size={14} color={colors.secondary} />
            <Text style={styles.secureText}>Conexión segura cifrada con Pikka</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar turno"
            onPress={() => { setConfirmingLogout(true) }}
            style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Cerrar turno</Text>
          </Pressable>
        </View>
      </ScrollView>

      <StopPickerModal
        visible={picking}
        stops={attended}
        currentId={currentId}
        driver={position}
        onClose={() => { setPicking(false) }}
        onFocus={focusOrder}
        onAttend={setPinnedId}
      />

      <Modal transparent animationType="fade" visible={confirmingLogout} onRequestClose={() => { setConfirmingLogout(false) }}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View style={styles.dialogIcon}>
              <Ionicons name="log-out-outline" size={28} color={colors.error} />
            </View>
            <Text style={styles.dialogTitle}>¿Finalizar tu turno?</Text>
            <Text style={styles.dialogBody}>
              {active.length > 0
                ? `Tienes ${String(active.length)} paradas pendientes. Si sales ahora, el despachador reasignará tu ruta.`
                : 'No tienes paradas pendientes. Puedes cerrar tu sesión.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => { setConfirmingLogout(false); void clear() }}
              style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}
            >
              <Text style={styles.confirmText}>Confirmar y cerrar sesión</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setConfirmingLogout(false) }} style={styles.cancel}>
              <Text style={styles.cancelText}>Permanecer en turno</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

interface TabButtonProps {
  label: string
  count: number
  selected: boolean
  onPress: () => void
}

/** Vista vacía de la ruta: sin ruta asignada, o sin paradas en una pestaña. No es un error. */
function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View accessibilityRole="summary" style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  )
}

function TabButton({ label, count, selected, onPress }: TabButtonProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tab, selected && styles.tabSelected]}
    >
      <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{label}</Text>
      <View style={styles.tabCount}>
        <Text style={styles.tabCountText}>{count}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 16 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  profileText: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontSize: 20, fontWeight: '600', color: colors.primary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(107,249,228,0.4)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondary },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.onSecondaryContainer },
  subtitle: { fontSize: 12, color: colors.onSurfaceVariant },
  demo: { alignSelf: 'flex-start', backgroundColor: '#fff3cd', color: '#664d03', fontWeight: '700', fontSize: 11, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  tabs: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.surfaceContainer, borderRadius: 8, padding: 4, gap: 4 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  tabSelected: { backgroundColor: colors.surfaceContainerLowest },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant },
  tabTextSelected: { color: colors.primary },
  tabCount: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabCountText: { fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceContainerLowest, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 14, color: colors.onSurface, padding: 0 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 4 },
  pageBtn: { padding: 6, borderRadius: 999, backgroundColor: colors.surfaceContainer },
  off: { opacity: 0.4 },
  pageText: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant },
  info: { color: colors.onSurfaceVariant, textAlign: 'center' },
  empty: { alignItems: 'center', gap: 6, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 20 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: colors.onSurface, textAlign: 'center' },
  emptyBody: { fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center' },
  error: { color: colors.onErrorContainer, backgroundColor: colors.errorContainer, borderRadius: 10, padding: 12 },
  footer: { alignItems: 'center', gap: 8, paddingTop: 4 },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureText: { fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant },
  logout: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,218,214,0.4)' },
  logoutText: { fontSize: 14, fontWeight: '700', color: colors.error },
  pressed: { opacity: 0.85 },
  overlay: { flex: 1, backgroundColor: 'rgba(29,52,57,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 384, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 24, gap: 12, alignItems: 'center' },
  dialogIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.errorContainer, alignItems: 'center', justifyContent: 'center' },
  dialogTitle: { fontSize: 20, fontWeight: '600', color: colors.onBackground, textAlign: 'center' },
  dialogBody: { fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center' },
  confirm: { alignSelf: 'stretch', paddingVertical: 12, borderRadius: 8, backgroundColor: colors.error, alignItems: 'center' },
  confirmText: { color: colors.onError, fontWeight: '700' },
  cancel: { alignSelf: 'stretch', paddingVertical: 12, borderRadius: 8, backgroundColor: colors.surfaceContainer, alignItems: 'center' },
  cancelText: { color: colors.onSurfaceVariant, fontWeight: '600' },
})
