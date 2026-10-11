import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/colors'

interface Props {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline' | 'danger'
}

export function Button({ label, onPress, loading = false, disabled = false, variant = 'primary' }: Props) {
  const off = disabled || loading
  const variantStyle = variant === 'primary' ? styles.primary : variant === 'danger' ? styles.danger : styles.outline
  const textStyle = variant === 'primary' ? styles.textOn : variant === 'danger' ? styles.textDanger : styles.textOutline
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy: loading }}
      disabled={off}
      onPress={onPress}
      style={[styles.base, variantStyle, off ? styles.off : null]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} /> : <Text style={[styles.text, textStyle]}>{label}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primary: { backgroundColor: colors.primary },
  outline: { borderWidth: 1, borderColor: colors.primary, backgroundColor: 'transparent' },
  danger: { borderWidth: 1, borderColor: colors.error, backgroundColor: 'transparent' },
  off: { opacity: 0.6 },
  text: { fontSize: 16, fontWeight: '700' },
  textOn: { color: colors.onPrimary },
  textOutline: { color: colors.primary },
  textDanger: { color: colors.error },
})
