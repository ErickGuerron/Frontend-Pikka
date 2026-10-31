import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../../theme/colors'
import { isDisputable, type BalanceLine } from './balance'
import { maxDisputeReason, validateDisputeReason } from './dispute'

interface Props {
  line: BalanceLine
  /** Sends the dispute. Resolves to null when it was opened, or to the message to show when it was not. */
  onDispute: (surchargeId: string, reason: string) => Promise<string | null>
}

/**
 * What the customer can do with a surcharge (ADR 0007, section 6): dispute it while the window lasts, or see how their
 * dispute stands. Other charges cannot be disputed and show nothing.
 */
export function DisputeControl({ line, onDispute }: Props) {
  const [editing, setEditing] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  if (line.disputeStatus === 'OPEN') return <Text style={[styles.badge, styles.badgeInfo]}>En disputa</Text>
  if (line.disputeStatus === 'AGAINST') return <Text style={[styles.badge, styles.badgeWarn]}>Disputa rechazada</Text>
  if (!isDisputable(line)) return null

  if (!editing) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel="Disputar" style={styles.link} onPress={() => { setEditing(true) }}>
        <Text style={styles.linkText}>Disputar</Text>
      </Pressable>
    )
  }

  const send = async () => {
    const problem = validateDisputeReason(reason)
    if (problem !== null) {
      setError(problem)
      return
    }
    setError(null)
    setSending(true)
    const failure = await onDispute(line.id, reason.trim())
    setSending(false)
    if (failure !== null) setError(failure)
  }

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Motivo de la disputa</Text>
      <TextInput
        accessibilityLabel="Motivo de la disputa"
        style={styles.input}
        multiline
        maxLength={maxDisputeReason}
        value={reason}
        onChangeText={setReason}
      />
      {error !== null ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Enviar disputa" disabled={sending} style={[styles.send, sending && styles.disabled]} onPress={() => { void send() }}>
          <Text style={styles.sendText}>{sending ? 'Enviando…' : 'Enviar disputa'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancelar disputa" onPress={() => { setEditing(false); setError(null) }}>
          <Text style={styles.cancel}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2, fontSize: 11, fontWeight: '700' },
  badgeInfo: { borderColor: '#cce7ea', backgroundColor: '#e8f7f9', color: colors.primary },
  badgeWarn: { borderColor: '#fcd34d', backgroundColor: '#fffbeb', color: '#78350f' },
  link: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4 },
  linkText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  form: { flexBasis: '100%', gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: colors.primary },
  input: { minHeight: 64, borderRadius: 8, borderWidth: 1, borderColor: '#cce7ea', padding: 8, fontSize: 14, color: colors.primary, textAlignVertical: 'top' },
  error: { fontSize: 12, fontWeight: '600', color: '#7f1d1d' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  send: { borderRadius: 8, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6 },
  sendText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  disabled: { opacity: 0.5 },
  cancel: { fontSize: 12, color: '#557b7f', textDecorationLine: 'underline' },
})
