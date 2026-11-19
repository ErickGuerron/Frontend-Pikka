import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { colors } from '../../theme/colors'
import { balanceReasonLabel, formatDueDate, formatMoney, hasDebt, type MyBalance } from './balance'
import { DisputeControl } from './DisputeControl'
import type { Outcome } from './payment-outcome'

interface Props {
  /** null while unknown or unavailable: the card takes up no space. */
  balance: MyBalance | null
  paying: boolean
  outcome: Outcome | null
  onPay: () => void
  onDismissOutcome: () => void
  /** Sends a dispute over one surcharge; without it the card shows no dispute controls. */
  onDispute?: (surchargeId: string, reason: string) => Promise<string | null>
}

/**
 * What the customer owes (ADR 0006): total, each line with its reason and due date, and the button that pays
 * the whole balance with the simulated card. Presentational: the screen owns the data. With no debt and no
 * message to show it takes up no space. It asks for no card data, not even in simulation.
 */
export function BalanceCard({ balance, paying, outcome, onPay, onDismissOutcome, onDispute }: Props) {
  const owes = balance !== null && hasDebt(balance)
  if (!owes && outcome === null) return null

  const notice =
    outcome === null ? null : (
      <View
        accessibilityLiveRegion="polite"
        style={[styles.notice, outcome.tone === 'ok' ? styles.noticeOk : styles.noticeWarn]}
      >
        <Text style={[styles.noticeText, outcome.tone === 'ok' ? styles.noticeTextOk : styles.noticeTextWarn]}>{outcome.text}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso de pago" hitSlop={8} onPress={onDismissOutcome}>
          <Text style={styles.close}>×</Text>
        </Pressable>
      </View>
    )

  if (!owes) return notice

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Tu saldo pendiente</Text>
        <Text style={styles.total}>{formatMoney(balance.pendingSurcharge)}</Text>
      </View>

      {balance.blocked ? (
        <Text accessibilityRole="alert" style={styles.blocked}>
          Tu cuenta está bloqueada por saldo pendiente: no puedes crear ni cancelar pedidos hasta que pagues.
        </Text>
      ) : null}

      {balance.lines.map((line) => (
        <View key={line.id} style={styles.line}>
          <View style={styles.lineText}>
            <Text style={styles.reason}>{balanceReasonLabel(line.reason)}</Text>
            <Text style={styles.due}>{`Pagar antes del ${formatDueDate(line.dueAt)}`}</Text>
          </View>
          <Text style={styles.amount}>{formatMoney(line.amount)}</Text>
          {onDispute === undefined ? null : <DisputeControl line={line} onDispute={onDispute} />}
        </View>
      ))}

      <Text style={styles.simulated}>Pago simulado: no se hará ningún cargo real. No pedimos datos de tarjeta.</Text>
      <Button label={`Pagar saldo (${formatMoney(balance.pendingSurcharge)})`} loading={paying} onPress={onPay} />
      {notice}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cce7ea',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: colors.primary },
  total: { fontSize: 24, fontWeight: '700', color: colors.primary },
  blocked: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
    padding: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#7f1d1d',
  },
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: '#cce7ea', paddingTop: 10 },
  lineText: { flex: 1, gap: 2 },
  reason: { fontSize: 14, fontWeight: '600', color: colors.primary },
  due: { fontSize: 12, color: '#557b7f' },
  amount: { fontSize: 15, fontWeight: '700', color: colors.primary },
  simulated: { fontSize: 12, color: '#557b7f' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  noticeOk: { borderColor: '#cce7ea', backgroundColor: '#e8f7f9' },
  noticeWarn: { borderColor: '#fcd34d', backgroundColor: '#fffbeb' },
  noticeText: { flex: 1, fontSize: 13, fontWeight: '600' },
  noticeTextOk: { color: colors.primary },
  noticeTextWarn: { color: '#78350f' },
  close: { fontSize: 20, fontWeight: '700', lineHeight: 20, color: colors.primary },
})
