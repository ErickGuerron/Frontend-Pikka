import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { evaluatePasswordRules, passwordMeetsPolicy } from './signup-validation'

const CONTENT_RULES = ['length', 'upper', 'lower', 'digit', 'special'] as const

export type StrengthLevel = 'weak' | 'medium' | 'strong'

/** Segments lit (0-5) from the five content rules; strong only when the whole policy passes. */
export function passwordStrength(password: string): { met: number; level: StrengthLevel } {
  const rules = evaluatePasswordRules(password)
  const met = rules.filter((r) => (CONTENT_RULES as readonly string[]).includes(r.id) && r.met).length
  const level: StrengthLevel = passwordMeetsPolicy(password) ? 'strong' : met >= 3 ? 'medium' : 'weak'
  return { met, level }
}

const levelLabel: Record<StrengthLevel, string> = { weak: 'Débil', medium: 'Media', strong: 'Segura' }
const levelColor: Record<StrengthLevel, string> = { weak: colors.error, medium: '#d98e04', strong: '#1e8e3e' }

export function PasswordStrength({ password }: { password: string }) {
  const { met, level } = passwordStrength(password)
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Seguridad de la contraseña"
      accessibilityValue={{ min: 0, max: CONTENT_RULES.length, now: met, text: levelLabel[level] }}
      style={styles.wrap}
    >
      <View style={styles.bar}>
        {CONTENT_RULES.map((rule, index) => (
          <View key={rule} style={[styles.segment, index < met ? { backgroundColor: levelColor[level] } : null]} />
        ))}
      </View>
      {password.length > 0 ? <Text style={styles.label}>{levelLabel[level]}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  bar: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceContainerHigh },
  label: { fontSize: 12, color: colors.onSurfaceVariant },
})
