import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { userMessage } from '../../api/errors'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { ValidationAlert } from '../../components/ValidationAlert'
import { colors } from '../../theme/colors'
import { normalizePhone, POSTAL_MAX, REFERENCE_MAX, sanitizeDateInput, sanitizePhoneInput } from '../contact/validation'
import { useCatalog } from './hooks'
import { AddressMapPicker } from './map/AddressMapPicker'
import type { Coordinate } from './map/geo'
import { OrderItemsPicker } from './OrderItemsPicker'
import { useOrdersStore } from './orders-store'
import { formatCents, priceLines, totalCents } from './products'
import {
  deliveryWindows,
  formatWindow,
  localToday,
  validateNewOrder,
  type CustomerOrder,
  type NewCustomerOrder,
  type OrderErrors,
  type OrderLine,
} from './types'

interface Props {
  /** Product the customer chose in the catalog: it starts selected, one unit. */
  initialProductId?: string | undefined
  onCreated: (order: CustomerOrder) => void
}

type Step = 'form' | 'confirm'

const fieldLabels: Record<keyof OrderErrors, string> = {
  items: 'Productos',
  address: 'Dirección de entrega',
  addressReference: 'Referencia del lugar',
  postalCode: 'Código postal',
  contactPhone: 'Teléfono de contacto',
  deliveryDate: 'Fecha de entrega',
  window: 'Ventana de entrega',
}

/** Two steps: the form, then a summary the customer confirms; nothing is sent before that. */
export function NewOrderForm({ initialProductId, onCreated }: Props) {
  const create = useOrdersStore((s) => s.create)
  const catalog = useCatalog()
  const [step, setStep] = useState<Step>('form')
  const [address, setAddress] = useState('')
  const [location, setLocation] = useState<Coordinate | null>(null)
  const [addressReference, setAddressReference] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [items, setItems] = useState<OrderLine[]>([])
  const [deliveryDate, setDeliveryDate] = useState(localToday())
  const [windowStart, setWindowStart] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<OrderErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [missing, setMissing] = useState<string[]>([])

  // Once the catalog is loaded, the product picked in the catalog comes selected (only if it exists and nothing is chosen yet).
  useEffect(() => {
    if (initialProductId === undefined || !catalog.products.some((p) => p.id === initialProductId)) return
    setItems((current) => (current.length === 0 ? [{ productId: initialProductId, quantity: 1 }] : current))
  }, [initialProductId, catalog.products])

  const chosen = deliveryWindows.find((w) => w.start === windowStart)
  const buildInput = (): NewCustomerOrder => ({
    address: address.trim(),
    addressReference: addressReference.trim(),
    ...(postalCode.trim() === '' ? {} : { postalCode: postalCode.trim() }),
    contactPhone: normalizePhone(contactPhone.trim()),
    deliveryDate: deliveryDate.trim(),
    windowStart: chosen?.start ?? '',
    windowEnd: chosen?.end ?? '',
    items,
    notes: notes.trim(),
    ...(location === null ? {} : { location }),
  })

  const review = () => {
    setServerError(null)
    const found = validateNewOrder(buildInput(), localToday())
    setErrors(found)
    if (Object.keys(found).length === 0) setStep('confirm')
    else setMissing((Object.keys(fieldLabels) as (keyof OrderErrors)[]).filter((key) => found[key] !== undefined).map((key) => fieldLabels[key]))
  }

  const confirm = async () => {
    setServerError(null)
    setLoading(true)
    try {
      onCreated(await create(buildInput()))
    } catch (error) {
      setServerError(userMessage(error))
    } finally {
      setLoading(false)
    }
  }

  if (step === 'confirm') {
    const input = buildInput()
    const lines = priceLines(input.items, catalog.products)
    const rows: [string, string][] = [
      ['Dirección', input.address],
      ['Referencia', input.addressReference],
      ['Código postal', input.postalCode ?? 'No indicado'],
      ['Teléfono de contacto', input.contactPhone],
      ['Fecha de entrega', input.deliveryDate],
      ['Ventana', formatWindow(input.windowStart, input.windowEnd)],
      ...(input.location === undefined
        ? []
        : [['Punto en el mapa', `${input.location.latitude.toFixed(5)}, ${input.location.longitude.toFixed(5)}`] as [string, string]]),
    ]
    return (
      <View style={styles.form}>
        <Text style={styles.title}>Confirma tu pedido</Text>
        <Text style={styles.hint}>Revisa que todo esté bien. Al confirmar enviaremos el pedido.</Text>
        <View style={styles.summary}>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.item}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.summary}>
          {lines.map((line) => (
            <View key={line.productId} style={styles.lineRow}>
              <Text style={styles.value}>{`${String(line.quantity)} × ${line.name}`}</Text>
              <Text style={styles.value}>{formatCents(line.cents * line.quantity)}</Text>
            </View>
          ))}
          <View style={[styles.lineRow, styles.totalRow]}>
            <Text style={styles.total}>Total estimado</Text>
            <Text style={styles.total}>{formatCents(totalCents(lines))}</Text>
          </View>
        </View>
        {serverError ? (
          <Text accessibilityRole="alert" style={styles.serverError}>
            {serverError}
          </Text>
        ) : null}
        <Button label="Confirmar pedido" onPress={() => { void confirm() }} loading={loading} />
        <Button label="Editar datos" variant="outline" onPress={() => { setStep('form') }} disabled={loading} />
      </View>
    )
  }

  return (
    <View style={styles.form}>
      <ValidationAlert fields={missing} onClose={() => { setMissing([]) }} />
      <OrderItemsPicker catalog={catalog} value={items} onChange={setItems} error={errors.items} />
      <AddressMapPicker
        location={location}
        address={address}
        onChangeLocation={setLocation}
        onChangeAddress={(newAddress) => {
          setAddress(newAddress)
          if (errors.address) {
            setErrors((prev) => ({ ...prev, address: undefined }))
          }
        }}
      />
      <Field label="Dirección de entrega" value={address} onChangeText={setAddress} error={errors.address} placeholder="Calle y número" />
      <Field label="Referencia del lugar" value={addressReference} onChangeText={setAddressReference} error={errors.addressReference} placeholder="Casa azul, junto a la tienda" maxLength={REFERENCE_MAX} />
      <Field label="Código postal (opcional)" value={postalCode} onChangeText={setPostalCode} error={errors.postalCode} autoCapitalize="characters" maxLength={POSTAL_MAX} />
      <Field label="Teléfono de contacto" value={contactPhone} onChangeText={(text) => { setContactPhone(sanitizePhoneInput(text)) }} error={errors.contactPhone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
      <Field label="Fecha de entrega (AAAA-MM-DD)" value={deliveryDate} onChangeText={(text) => { setDeliveryDate(sanitizeDateInput(text)) }} error={errors.deliveryDate} keyboardType="numbers-and-punctuation" maxLength={10} />
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
      <Field label="Notas (opcional)" value={notes} onChangeText={setNotes} multiline />
      <Text style={styles.hint}>Las notas son solo de referencia en esta versión: todavía no se envían al servicio.</Text>
      <Button label="Revisar pedido" onPress={review} />
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  group: { gap: 6 },
  title: { fontSize: 20, fontWeight: '700', color: colors.onSurface },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.surfaceContainerLowest },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.onSurface, fontWeight: '600' },
  chipTextOn: { color: colors.onPrimary },
  error: { fontSize: 12, color: colors.error },
  hint: { fontSize: 12, color: colors.onSurfaceVariant },
  summary: { gap: 10, borderRadius: 12, backgroundColor: colors.surfaceContainerLow, padding: 12 },
  item: { gap: 2 },
  value: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.outlineVariant, paddingTop: 8 },
  total: { fontSize: 14, fontWeight: '700', color: colors.primary },
  serverError: { color: colors.error, backgroundColor: colors.errorContainer, borderRadius: 8, padding: 10, fontSize: 13 },
})
