import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { deliveryChanges, type DeliveryDetails } from '../../../../shared/customer-orders/edit'
import { ApiError, userMessage } from '../../api/errors'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { colors } from '../../theme/colors'
import { sanitizeDateInput, sanitizePhoneInput } from '../contact/validation'
import { AddressMapPicker } from './map/AddressMapPicker'
import { useOrdersStore } from './orders-store'
import type { CustomerOrder } from './types'

export function EditOrderForm({ order, onClose }: { order: CustomerOrder; onClose: () => void }) {
  const edit = useOrdersStore((state) => state.edit)
  const [original] = useState<DeliveryDetails>(() => ({
    address: order.address,
    location: order.latitude === undefined || order.longitude === undefined ? null : {
      latitude: order.latitude,
      longitude: order.longitude,
    },
    deliveryDate: order.deliveryDate,
    windowStart: order.windowStart,
    windowEnd: order.windowEnd,
    addressReference: order.addressReference ?? '',
    postalCode: order.postalCode ?? '',
    contactPhone: order.contactPhone ?? '',
  }))
  const [draft, setDraft] = useState(original)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pending = order.status === 'PENDING'
  const setField = (key: keyof Omit<DeliveryDetails, 'location'>, value: string) => {
    setDraft((previous) => ({ ...previous, [key]: value }))
  }

  const save = async () => {
    const changes = deliveryChanges(original, draft, pending)
    if (changes === null) {
      setError('Marca el punto de entrega en el mapa.')
      return
    }
    if (Object.keys(changes).length === 0) {
      onClose()
      return
    }
    setError(null)
    setBusy(true)
    try {
      await edit(order.id, changes)
      onClose()
    } catch (failure) {
      setError(failure instanceof ApiError && [409, 422].includes(failure.status) ? failure.message : userMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.title}>Editar pedido</Text>
      {pending ? (
        <>
          <AddressMapPicker
            location={draft.location}
            address={draft.address}
            onChangeLocation={(location) => { setDraft((previous) => ({ ...previous, location })) }}
            onChangeAddress={(value) => { setField('address', value) }}
          />
          <Field label="Dirección de entrega" editable={!busy} value={draft.address} onChangeText={(value) => { setField('address', value) }} />
          <Field label="Fecha de entrega" editable={!busy} placeholder="AAAA-MM-DD" value={draft.deliveryDate} onChangeText={(value) => { setField('deliveryDate', sanitizeDateInput(value)) }} />
          <Field label="Inicio de ventana" editable={!busy} placeholder="09:00" value={draft.windowStart} onChangeText={(value) => { setField('windowStart', value) }} />
          <Field label="Fin de ventana" editable={!busy} placeholder="12:00" value={draft.windowEnd} onChangeText={(value) => { setField('windowEnd', value) }} />
        </>
      ) : null}
      <Field label="Referencia del lugar" editable={!busy} value={draft.addressReference} onChangeText={(value) => { setField('addressReference', value) }} />
      <Field label="Teléfono de contacto" editable={!busy} keyboardType="phone-pad" value={draft.contactPhone} onChangeText={(value) => { setField('contactPhone', sanitizePhoneInput(value)) }} />
      <Field label="Código postal (opcional)" editable={!busy} value={draft.postalCode} onChangeText={(value) => { setField('postalCode', value) }} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button label="Guardar cambios" loading={busy} onPress={() => { void save() }} />
      <Button label="Cerrar edición" disabled={busy} variant="outline" onPress={onClose} />
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.onSurface },
  error: { color: colors.error },
})
