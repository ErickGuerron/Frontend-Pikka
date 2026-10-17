import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

interface Props {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline' | 'danger'
  rightIcon?: ReactNode
}

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  rightIcon,
}: Props) {
  const off = disabled || loading
  const variantStyle =
    variant === 'primary' ? styles.primary : variant === 'danger' ? styles.danger : styles.outline
  const textStyle =
    variant === 'primary' ? styles.textOn : variant === 'danger' ? styles.textDanger : styles.textOutline

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy: loading }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        off ? styles.off : null,
        pressed && !off ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
      ) : (
        <View style={styles.contentRow}>
          <Text style={[styles.text, textStyle]}>{label}</Text>
          {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#004b4e',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  primary: { backgroundColor: '#004b4e' },
  outline: { borderWidth: 1, borderColor: '#004b4e', backgroundColor: 'transparent' },
  danger: { borderWidth: 1, borderColor: colors.error, backgroundColor: 'transparent' },
  off: { opacity: 0.6 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  contentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  rightIcon: { marginLeft: 2 },
  text: { fontSize: 14, fontWeight: '700' },
  textOn: { color: colors.onPrimary },
  textOutline: { color: '#004b4e' },
  textDanger: { color: colors.error },
})
