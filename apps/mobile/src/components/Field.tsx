import type { ReactNode } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors } from '../theme/colors'

interface Props extends Omit<TextInputProps, 'style'> {
  label: string
  error?: string | undefined
  right?: ReactNode
  leftIcon?: ReactNode
}

export function Field({ label, error, right, leftIcon, ...input }: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, error ? styles.boxError : null]}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          aria-label={label}
          placeholderTextColor="#94a3b8"
          style={styles.input}
          {...input}
        />
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
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cce7ea',
    borderRadius: 14,
    backgroundColor: '#f0fbfb',
    paddingHorizontal: 12,
  },
  boxError: { borderColor: colors.error },
  leftIcon: { marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    minHeight: 46,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 8,
  },
  error: { fontSize: 12, color: colors.error, marginTop: 2 },
})
