import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { userMessage } from '../../api/errors'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { colors } from '../../theme/colors'
import { useOrdersStore } from './orders-store'
import { deliveryWindows, localToday, validateNewOrder, type CustomerOrder, type OrderErrors } from './types'

interface Props {
  onCreated: (order: CustomerOrder) => void
}

export function NewOrderForm({ onCreated }: Props) {
  const create = useOrdersStore((s) => s.create)
  const [address, setAddress] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(localToday())
  const [windowStart, setWindowStart] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<OrderErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setServerError(null)
    const chosen = deliveryWindows.find((w) => w.start === windowStart)
    const input = { address: address.trim(), deliveryDate: deliveryDate.trim(), windowStart: chosen?.start ?? '', windowEnd: chosen?.end ?? '', notes: notes.trim() }
    const found = validateNewOrder(input, localToday())
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setLoading(true)
    try {
      onCreated(await create(input))
    } catch (error) {
      setServerError(userMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.form}>
      <Field label="Dirección de entrega" value={address} onChangeText={setAddress} error={errors.address} placeholder="Calle, número y referencia" editable={!loading} />
      <Field label="Fecha de entrega (AAAA-MM-DD)" value={deliveryDate} onChangeText={setDeliveryDate} error={errors.deliveryDate} keyboardType="numbers-and-punctuation" maxLength={10} editable={!loading} />
      <View style={styles.group}>
        <Text style={styles.label}>Ventana de entrega</Text>
        <View style={styles.chips}>
          {deliveryWindows.map((w) => (
            <Pressable
              key={w.start}
              accessibilityRole="button"
              accessibilityLabel={`Ventana ${w.label}`}
              accessibilityState={{ selected: windowStart === w.start }}
              onPress={() => {
                setWindowStart(w.start)
              }}
              style={[styles.chip, windowStart === w.start ? styles.chipOn : null]}
            >
              <Text style={[styles.chipText, windowStart === w.start ? styles.chipTextOn : null]}>{w.label}</Text>
            </Pressable>
          ))}
        </View>
        {errors.window ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {errors.window}
          </Text>
        ) : null}
      </View>
      <Field label="Notas (opcional)" value={notes} onChangeText={setNotes} multiline editable={!loading} />
      <Text style={styles.hint}>Las notas son solo de referencia en esta versión: todavía no se envían al servicio.</Text>
      {serverError ? (
        <Text accessibilityRole="alert" style={styles.serverError}>
          {serverError}
        </Text>
      ) : null}
      <Button label="Confirmar pedido" onPress={() => { void submit() }} loading={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  group: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.surfaceContainerLowest },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.onSurface, fontWeight: '600' },
  chipTextOn: { color: colors.onPrimary },
  error: { fontSize: 12, color: colors.error },
  hint: { fontSize: 12, color: colors.onSurfaceVariant },
  serverError: { color: colors.error, backgroundColor: colors.errorContainer, borderRadius: 8, padding: 10, fontSize: 13 },
})
