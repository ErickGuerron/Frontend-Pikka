import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { isDriverDemoMode } from '../../../api/config'
import { useSessionStore } from '../../../store/session-store'
import { colors } from '../../../theme/colors'
import { useDriverRoute } from '../../../features/driver-route/hooks'
import { RouteStopCard } from '../../../features/driver-route/RouteStopCard'
import { orderedStops, remainingCount } from '../../../features/driver-route/types'
import { Button } from '../../../components/Button'

export default function DriverRouteScreen() {
  const { route, loading, error, unavailable, reload, submit } = useDriverRoute()
  const user = useSessionStore((s) => s.user)
  const clear = useSessionStore((s) => s.clear)
  const stops = route === null ? [] : orderedStops(route.stops)

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading && route !== null} onRefresh={() => { void reload() }} />}
    >
      <View style={styles.top}>
        <Text style={styles.hello}>Hola{user ? `, ${user.fullName}` : ''}</Text>
        <Text style={styles.subtitle}>
          {route === null ? 'Ruta de hoy' : `Ruta de hoy · ${remainingCount(route.stops)} paradas pendientes`}
        </Text>
        {isDriverDemoMode() ? <Text style={styles.demo}>DEMO · datos simulados</Text> : null}
      </View>

      {loading && route === null ? <Text style={styles.info}>Cargando tu ruta…</Text> : null}
      {error !== null ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {unavailable ? error : `No pudimos cargar tu ruta. ${error}`}
        </Text>
      ) : null}
      {!loading && route !== null && stops.length === 0 ? (
        <Text style={styles.info}>No tienes paradas asignadas por ahora.</Text>
      ) : null}

      {stops.map((stop) => (
        <RouteStopCard key={stop.id} stop={stop} onSubmit={submit} />
      ))}

      <Button label="Cerrar sesión" variant="outline" onPress={() => { void clear() }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },
  top: { gap: 4 },
  hello: { fontSize: 20, fontWeight: '700', color: colors.onSurface },
  subtitle: { color: colors.onSurfaceVariant },
  demo: { alignSelf: 'flex-start', backgroundColor: '#fff3cd', color: '#664d03', fontWeight: '700', fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  info: { color: colors.onSurfaceVariant, textAlign: 'center' },
  error: { color: colors.onErrorContainer, backgroundColor: colors.errorContainer, borderRadius: 10, padding: 12 },
})
