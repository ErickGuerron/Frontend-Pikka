import { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import type { CatalogState } from './hooks'
import { formatCents, maxQuantity, priceLines, toCents, totalCents, type Product } from './products'
import type { OrderLine } from './types'

interface Props {
  catalog: CatalogState
  value: OrderLine[]
  onChange: (lines: OrderLine[]) => void
  error?: string | undefined
  disabled?: boolean
}

const PAGE_SIZE = 5

/** Active catalog with a quantity stepper per product, capped at 5 per page with paginated catalog modal. */
export function OrderItemsPicker({ catalog, value, onChange, error, disabled = false }: Props) {
  const [currentPage, setCurrentPage] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [modalPage, setModalPage] = useState(0)

  const quantityOf = (id: string) => value.find((line) => line.productId === id)?.quantity ?? 0

  const setQuantity = (id: string, quantity: number) => {
    const rest = value.filter((line) => line.productId !== id)
    onChange(quantity > 0 ? [...rest, { productId: id, quantity }] : rest)
  }

  const units = value.reduce((sum, line) => sum + line.quantity, 0)
  const total = totalCents(priceLines(value, catalog.products))

  // Main form pagination (5 products per page)
  const totalPages = Math.max(1, Math.ceil(catalog.products.length / PAGE_SIZE))
  const displayedProducts = catalog.products.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  )

  // Modal filtered & paginated products
  const filteredModalProducts = catalog.products.filter((p) =>
    p.name.toLowerCase().includes(modalSearch.trim().toLowerCase())
  )
  const totalModalPages = Math.max(1, Math.ceil(filteredModalProducts.length / PAGE_SIZE))
  const displayedModalProducts = filteredModalProducts.slice(
    modalPage * PAGE_SIZE,
    (modalPage + 1) * PAGE_SIZE
  )

  const renderProductRow = (product: Product, isModal = false) => {
    const quantity = quantityOf(product.id)
    const max = maxQuantity(product)
    const soldOut = max === 0

    return (
      <View
        key={product.id}
        style={[
          styles.row,
          quantity > 0 ? styles.rowOn : null,
          soldOut ? styles.soldOut : null,
        ]}
      >
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
            onPress={() => {
              setQuantity(product.id, quantity - 1)
            }}
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
            onPress={() => {
              setQuantity(product.id, quantity + 1)
            }}
            style={[styles.step, disabled || quantity >= max ? styles.stepOff : null]}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.group}>
      {/* Header with Title and "Ver catálogo" button */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.label}>Productos</Text>
          <Text style={styles.sublabel}>
            {catalog.products.length > 0
              ? `Mostrando ${displayedProducts.length} de ${catalog.products.length} productos`
              : ''}
          </Text>
        </View>

        {catalog.products.length > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.catalogBtn, pressed && styles.btnPressed]}
            onPress={() => {
              setModalSearch('')
              setModalPage(0)
              setModalVisible(true)
            }}
            accessibilityRole="button"
            accessibilityLabel="Ver catálogo completo"
          >
            <Ionicons name="book-outline" size={15} color="#004b4e" />
            <Text style={styles.catalogBtnText}>Ver catálogo</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Main product list (strictly 5 items per page) */}
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
        <View style={styles.productsList}>
          {displayedProducts.map((p) => renderProductRow(p, false))}
        </View>
      )}

      {/* In-form Pagination Controls (if more than 5 products) */}
      {totalPages > 1 ? (
        <View style={styles.paginationBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Página anterior de productos"
            accessibilityState={{ disabled: currentPage === 0 }}
            disabled={currentPage === 0}
            onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
            style={[styles.pageBtn, currentPage === 0 ? styles.pageBtnDisabled : null]}
          >
            <Ionicons
              name="chevron-back"
              size={15}
              color={currentPage === 0 ? '#94a3b8' : '#004b4e'}
            />
            <Text
              style={[
                styles.pageBtnText,
                currentPage === 0 ? styles.pageBtnTextDisabled : null,
              ]}
            >
              Anterior
            </Text>
          </Pressable>

          <Text style={styles.pageIndicator}>
            Página {currentPage + 1} de {totalPages}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Página siguiente de productos"
            accessibilityState={{ disabled: currentPage >= totalPages - 1 }}
            disabled={currentPage >= totalPages - 1}
            onPress={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            style={[
              styles.pageBtn,
              currentPage >= totalPages - 1 ? styles.pageBtnDisabled : null,
            ]}
          >
            <Text
              style={[
                styles.pageBtnText,
                currentPage >= totalPages - 1 ? styles.pageBtnTextDisabled : null,
              ]}
            >
              Siguiente
            </Text>
            <Ionicons
              name="chevron-forward"
              size={15}
              color={currentPage >= totalPages - 1 ? '#94a3b8' : '#004b4e'}
            />
          </Pressable>
        </View>
      ) : null}

      {/* Cart Summary */}
      <View style={styles.totalRow}>
        <Text style={styles.hint}>
          {units === 0
            ? 'Sin productos elegidos'
            : `${String(units)} ${units === 1 ? 'unidad' : 'unidades'} seleccionadas`}
        </Text>
        <Text style={styles.total}>Total estimado {formatCents(total)}</Text>
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      {/* Full Catalog Modal with Search & 5-item Pagination */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Catálogo de Productos</Text>
              <Text style={styles.modalSubtitle}>
                Selecciona las cantidades para tu pedido (5 por página)
              </Text>
            </View>

            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar catálogo"
            >
              <Ionicons name="close" size={22} color="#004b4e" />
            </Pressable>
          </View>

          {/* Search Box */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color="#6f7979" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre de producto..."
              placeholderTextColor="#94a3b8"
              value={modalSearch}
              onChangeText={(text) => {
                setModalSearch(text)
                setModalPage(0)
              }}
              clearButtonMode="while-editing"
            />
            {modalSearch.length > 0 ? (
              <Pressable onPress={() => setModalSearch('')}>
                <Ionicons name="close-circle" size={16} color="#6f7979" />
              </Pressable>
            ) : null}
          </View>

          {/* Products Scroll List */}
          <ScrollView
            contentContainerStyle={styles.modalProductsScroll}
            showsVerticalScrollIndicator={false}
          >
            {displayedModalProducts.length === 0 ? (
              <View style={styles.emptySearchBox}>
                <Ionicons name="search-outline" size={36} color="#94a3b8" />
                <Text style={styles.emptySearchTitle}>Sin coincidencias</Text>
                <Text style={styles.emptySearchDesc}>
                  No encontramos productos para "{modalSearch}".
                </Text>
              </View>
            ) : (
              displayedModalProducts.map((p) => renderProductRow(p, true))
            )}
          </ScrollView>

          {/* Modal Pagination Controls */}
          {totalModalPages > 1 ? (
            <View style={styles.modalPaginationBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Página anterior de catálogo modal"
                disabled={modalPage === 0}
                onPress={() => setModalPage((p) => Math.max(0, p - 1))}
                style={[styles.pageBtn, modalPage === 0 ? styles.pageBtnDisabled : null]}
              >
                <Ionicons
                  name="chevron-back"
                  size={15}
                  color={modalPage === 0 ? '#94a3b8' : '#004b4e'}
                />
                <Text
                  style={[
                    styles.pageBtnText,
                    modalPage === 0 ? styles.pageBtnTextDisabled : null,
                  ]}
                >
                  Anterior
                </Text>
              </Pressable>

              <Text style={styles.pageIndicator}>
                Página {modalPage + 1} de {totalModalPages}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Página siguiente de catálogo modal"
                disabled={modalPage >= totalModalPages - 1}
                onPress={() => setModalPage((p) => Math.min(totalModalPages - 1, p + 1))}
                style={[
                  styles.pageBtn,
                  modalPage >= totalModalPages - 1 ? styles.pageBtnDisabled : null,
                ]}
              >
                <Text
                  style={[
                    styles.pageBtnText,
                    modalPage >= totalModalPages - 1 ? styles.pageBtnTextDisabled : null,
                  ]}
                >
                  Siguiente
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={modalPage >= totalModalPages - 1 ? '#94a3b8' : '#004b4e'}
                />
              </Pressable>
            </View>
          ) : null}

          {/* Modal Footer / Confirm selection */}
          <View style={styles.modalFooter}>
            <View style={styles.modalFooterTotals}>
              <Text style={styles.modalFooterUnits}>
                {units === 0 ? '0 productos' : `${units} en el pedido`}
              </Text>
              <Text style={styles.modalFooterPrice}>{formatCents(total)}</Text>
            </View>

            <Pressable
              style={styles.modalDoneBtn}
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Volver al pedido"
            >
              <Text style={styles.modalDoneBtnText}>Listo, volver al pedido</Text>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  group: { gap: 10 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#004b4e',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sublabel: {
    fontSize: 11,
    color: '#6f7979',
    marginTop: 1,
  },
  catalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dff8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cce7ea',
  },
  catalogBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004b4e',
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  hint: { fontSize: 12, color: colors.onSurfaceVariant },
  productsList: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cce7ea',
    backgroundColor: '#ffffff',
    padding: 12,
    shadowColor: '#003232',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  rowOn: {
    borderColor: '#006b5f',
    backgroundColor: '#f5feff',
  },
  soldOut: { opacity: 0.6 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: '#004b4e' },
  price: { fontSize: 13, fontWeight: '800', color: '#006b5f' },
  soldOutText: { fontSize: 11, fontWeight: '700', color: colors.error },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dff8ff',
  },
  stepOff: { opacity: 0.35 },
  stepText: { fontSize: 20, fontWeight: '700', color: '#004b4e' },
  qty: { minWidth: 24, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#061f23' },

  // Pagination
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#dff8ff',
  },
  pageBtnDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.6,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004b4e',
  },
  pageBtnTextDisabled: {
    color: '#94a3b8',
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3f4949',
  },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#dff8ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  total: { fontSize: 14, fontWeight: '800', color: '#004b4e' },
  errorBox: { gap: 6, borderRadius: 8, backgroundColor: colors.errorContainer, padding: 10 },
  errorText: { color: colors.error, fontSize: 13 },
  retry: { color: colors.primary, fontWeight: '700' },
  error: { fontSize: 12, color: colors.error },

  // Modal styles
  modalSafe: {
    flex: 1,
    backgroundColor: '#effcff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 42, 47, 0.08)',
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#004b4e',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#6f7979',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dff8ff',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cce7ea',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#061f23',
  },
  modalProductsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  emptySearchBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptySearchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#004b4e',
  },
  emptySearchDesc: {
    fontSize: 12,
    color: '#6f7979',
    textAlign: 'center',
  },
  modalPaginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(19, 42, 47, 0.06)',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(19, 42, 47, 0.08)',
  },
  modalFooterTotals: {
    gap: 2,
  },
  modalFooterUnits: {
    fontSize: 11,
    color: '#6f7979',
    fontWeight: '500',
  },
  modalFooterPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#004b4e',
  },
  modalDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#004b4e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
})
