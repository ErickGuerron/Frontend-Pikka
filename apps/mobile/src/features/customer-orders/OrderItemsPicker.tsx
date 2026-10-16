import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { CatalogState } from './hooks'
import { formatCents, maxQuantity, priceLines, toCents, totalCents } from './products'
import type { OrderLine } from './types'

interface Props {
  catalog: CatalogState
  value: OrderLine[]
  onChange: (lines: OrderLine[]) => void
  error?: string | undefined
  disabled?: boolean
}

/** Active catalog with a quantity stepper per product. `value` keeps only lines with quantity > 0. */
export function OrderItemsPicker({ catalog, value, onChange, error, disabled = false }: Props) {
  const quantityOf = (id: string) => value.find((line) => line.productId === id)?.quantity ?? 0
  const setQuantity = (id: string, quantity: number) => {
    const rest = value.filter((line) => line.productId !== id)
    onChange(quantity > 0 ? [...rest, { productId: id, quantity }] : rest)
  }
  const units = value.reduce((sum, line) => sum + line.quantity, 0)
  const total = totalCents(priceLines(value, catalog.products))

  return (
    <View style={styles.group}>
      <Text style={styles.label}>Productos</Text>
      {catalog.loading ? (
        <Text style={styles.hint}>Cargando productos…</Text>
      ) : catalog.error ? (
        <View style={styles.errorBox}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            No pudimos cargar los productos. {catalog.error}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Reintentar" onPress={catalog.reload}>
            <Text style={styles.retry}>Reintentar</Text>
          </Pressable>
        </View>
      ) : catalog.products.length === 0 ? (
        <Text style={styles.hint}>Aún no hay productos disponibles para pedir.</Text>
      ) : (
        catalog.products.map((product) => {
          const quantity = quantityOf(product.id)
          const max = maxQuantity(product)
          const soldOut = max === 0
          return (
            <View key={product.id} style={[styles.row, quantity > 0 ? styles.rowOn : null, soldOut ? styles.soldOut : null]}>
              <View style={styles.info}>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.price}>{formatCents(toCents(product.unitPrice))}</Text>
                {soldOut ? <Text style={styles.soldOutText}>Agotado</Text> : null}
              </View>
              <View style={styles.stepper}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar una unidad de ${product.name}`}
                  accessibilityState={{ disabled: disabled || quantity === 0 }}
                  disabled={disabled || quantity === 0}
                  onPress={() => { setQuantity(product.id, quantity - 1) }}
                  style={[styles.step, disabled || quantity === 0 ? styles.stepOff : null]}
                >
                  <Text style={styles.stepText}>−</Text>
                </Pressable>
                <Text accessibilityLabel={`Cantidad de ${product.name}`} style={styles.qty}>
                  {quantity}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Agregar una unidad de ${product.name}`}
                  accessibilityState={{ disabled: disabled || quantity >= max }}
                  disabled={disabled || quantity >= max}
                  onPress={() => { setQuantity(product.id, quantity + 1) }}
                  style={[styles.step, disabled || quantity >= max ? styles.stepOff : null]}
                >
                  <Text style={styles.stepText}>+</Text>
                </Pressable>
              </View>
            </View>
          )
        })
      )}
      <View style={styles.totalRow}>
        <Text style={styles.hint}>{units === 0 ? 'Sin productos elegidos' : `${String(units)} ${units === 1 ? 'unidad' : 'unidades'}`}</Text>
        <Text style={styles.total}>Total estimado {formatCents(total)}</Text>
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
  group: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  hint: { fontSize: 12, color: colors.onSurfaceVariant },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest, padding: 12 },
  rowOn: { borderColor: colors.secondary },
  soldOut: { opacity: 0.6 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  price: { fontSize: 13, fontWeight: '700', color: colors.primary },
  soldOutText: { fontSize: 11, fontWeight: '700', color: colors.error },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainer },
  stepOff: { opacity: 0.4 },
  stepText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  qty: { minWidth: 24, textAlign: 'center', fontSize: 15, fontWeight: '700', color: colors.onSurface },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, backgroundColor: colors.surfaceContainerLow, paddingHorizontal: 12, paddingVertical: 10 },
  total: { fontSize: 14, fontWeight: '700', color: colors.primary },
  errorBox: { gap: 6, borderRadius: 8, backgroundColor: colors.errorContainer, padding: 10 },
  errorText: { color: colors.error, fontSize: 13 },
  retry: { color: colors.primary, fontWeight: '700' },
  error: { fontSize: 12, color: colors.error },
})
