import type { ReactNode } from 'react'
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'

interface Props {
  title: string
  subtitle: string
  children: ReactNode
}

/** Light mobile auth layout: circular mascot, title and a white rounded form card. */
export function AuthShell({ title, subtitle, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.mascot}>
              <Image source={require('../../assets/pikka.png')} style={styles.mascotImage} resizeMode="contain" accessibilityLabel="Mascota de Pikka" />
            </View>
            <Text style={styles.wordmark} accessibilityRole="header">
              pikka
            </Text>
            <Text style={styles.tagline}>Tus pedidos, en buenas manos</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 16, gap: 20 },
  hero: { alignItems: 'center', gap: 6, paddingTop: 8 },
  mascot: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mascotImage: { width: 96, height: 96 },
  wordmark: { fontSize: 34, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  tagline: { fontSize: 14, color: colors.onSurfaceVariant },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.onSurface },
  subtitle: { fontSize: 14, color: colors.onSurfaceVariant },
})
