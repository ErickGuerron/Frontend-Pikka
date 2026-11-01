import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'

/** Top bar of the driver home: brand, shift badge and the profile initial. */
export function DriverHeader({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || 'P'
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.bar}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Image accessibilityLabel="Pikka" source={require('../../../assets/pikka.png')} style={styles.otter} resizeMode="contain" />
          </View>
          <View style={styles.brandText}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Pikka</Text>
              <View style={styles.shift}>
                <View style={styles.dot} />
                <Text style={styles.shiftText}>En turno</Text>
              </View>
            </View>
            <Text style={styles.caption}>Repartidor</Text>
          </View>
        </View>
        <View accessibilityLabel={`Perfil de ${name}`} style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.surface },
  bar: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center' },
  otter: { width: 32, height: 32 },
  brandText: { gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 20, fontWeight: '700', color: colors.primary },
  shift: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(107,249,228,0.5)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondary },
  shiftText: { fontSize: 11, fontWeight: '700', color: colors.onSecondaryContainer },
  caption: { fontSize: 12, color: colors.onSurfaceVariant },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.onPrimary, fontWeight: '700' },
})
