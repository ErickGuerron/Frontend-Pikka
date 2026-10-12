import type { ReactNode } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors } from '../theme/colors'

interface Props extends Omit<TextInputProps, 'style'> {
  label: string
  error?: string | undefined
  right?: ReactNode
}

export function Field({ label, error, right, ...input }: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, error ? styles.boxError : null]}>
        <TextInput aria-label={label} placeholderTextColor={colors.outline} style={styles.input} {...input} />
        {right}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  group: { gap: 4 },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 12,
  },
  boxError: { borderColor: colors.error },
  input: { flex: 1, minHeight: 48, fontSize: 16, color: colors.onSurface },
  error: { fontSize: 12, color: colors.error },
})
