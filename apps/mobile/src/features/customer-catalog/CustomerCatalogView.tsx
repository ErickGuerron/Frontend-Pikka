import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { listProducts } from '../customer-orders/api'
import type { CustomerOrder } from '../customer-orders/types'
import type { Product } from '../customer-orders/products'
import { CATALOG_PRODUCTS, CATEGORY_FILTERS, getProductImage } from './catalog-data'
import { ProductDetailModal } from './ProductDetailModal'
import type { CatalogCategory, CatalogProduct } from './types'

interface Props {
  onOrderProduct?: (product: CatalogProduct) => void
  onExploreCatalog?: () => void
  orders?: CustomerOrder[]
}

export function CustomerCatalogView({
  onOrderProduct,
  onExploreCatalog,
  orders = [],
}: Props) {
  const [activeCategory, setActiveCategory] = useState<CatalogCategory>('todos')
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [backendProducts, setBackendProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function load() {
      try {
        const items = await listProducts(controller.signal)
        if (active) {
          setBackendProducts(items)
        }
      } catch {
        // Fallback to static catalog on connection issue
      } finally {
        if (active) {
          setLoadingProducts(false)
        }
      }
    }

    void load()

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  // Calculate top 5 products:
  // Shows the first 5 products from the real backend, or fallback to static catalog.
  const topProducts: CatalogProduct[] = (() => {
    if (backendProducts.length > 0) {
      // Pick top 5 products
      const top5 = backendProducts.slice(0, 5)

      return top5.map((p, idx) => ({
        id: p.id,
        ref: `TOP #${idx + 1}`,
        title: p.name,
        subtitle:
          p.stockQuantity !== undefined
            ? `${p.stockQuantity} unidades disponibles`
            : 'Disponible para despacho',
        price: `$${p.unitPrice}`,
        note: 'SELECCIÓN DESTACADA',
        rating: 4.9,
        imageUrl: getProductImage(p.name),
        category: 'pasteleria',
        accentColor: idx === 0 ? '#006b5f' : undefined,
      }))
    }

    // Fallback if backend products are still loading or empty
    return CATALOG_PRODUCTS.slice(0, 5)
  })()

  const displayedProducts =
    activeCategory === 'todos'
      ? topProducts
      : topProducts.filter((p) => p.category === activeCategory)

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* 1. Refined, Welcoming Hero Banner (Clutter-Free) */}
      <View style={styles.sectionHero}>
        <View style={styles.heroCard}>
          <View style={styles.headlineGroup}>
            <Text style={styles.heroHeadline}>
              Lo mejor de tu ciudad, en tu puerta.
            </Text>
            <Text style={styles.heroSubtitle}>
              Pastelería fina, flores y detalles seleccionados con dedicación para cada momento
              especial.
            </Text>
          </View>

          <View style={styles.heroActions}>
            <Pressable
              style={({ pressed }) => [styles.exploreBtn, pressed && styles.btnPressed]}
              onPress={onExploreCatalog}
              accessibilityRole="button"
              accessibilityLabel="Explorar catálogo"
            >
              <Text style={styles.exploreBtnText}>Explorar Catálogo</Text>
              <Ionicons name="arrow-forward" size={17} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* 2. Filter Bar */}
      <View style={styles.sectionFilters}>
        <View style={styles.filterHeader}>
          <View>
            <Text style={styles.filterHeadline}>Lo más pedido del día</Text>
            <Text style={styles.filterSubtitle}>Top 5 productos favoritos</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {CATEGORY_FILTERS.map((cat) => {
            const active = activeCategory === cat.key
            return (
              <Pressable
                key={cat.key}
                onPress={() => setActiveCategory(cat.key as CatalogCategory)}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active ? styles.filterChipTextActive : null,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {/* 3. Product Catalog Cards */}
      <View style={styles.sectionProducts}>
        {loadingProducts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#006b5f" />
            <Text style={styles.loadingText}>Cargando lo más pedido…</Text>
          </View>
        ) : null}

        {displayedProducts.map((product) => (
          <Pressable
            key={product.id}
            style={({ pressed }) => [styles.productCard, pressed && styles.btnPressed]}
            onPress={() => setSelectedProduct(product)}
            // No role="button": react-native-web would render <button>, and the "Pedir" button nests inside.
            accessibilityLabel={`Ver detalle de ${product.title}`}
          >
            {product.accentColor ? (
              <View
                style={[styles.productAccentBar, { backgroundColor: product.accentColor }]}
              />
            ) : null}

            <View style={styles.productImageWrapper}>
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.productDetails}>
              <View style={styles.productMetaRow}>
                <Text style={styles.productRef}>{product.ref}</Text>
              </View>

              <Text style={styles.productTitle} numberOfLines={1}>
                {product.title}
              </Text>

              <Text style={styles.productSubtitle} numberOfLines={1}>
                {product.subtitle}
              </Text>

              <View style={styles.productBottomRow}>
                <View>
                  <Text style={styles.productPrice}>{product.price}</Text>
                  <Text style={styles.productNote}>{product.note}</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.orderBtn, pressed && styles.btnPressed]}
                  onPress={(e) => {
                    e.stopPropagation()
                    onOrderProduct?.(product)
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Pedir ${product.title}`}
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                  <Text style={styles.orderBtnText}>Pedir</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* 4. Quality Guarantee Card */}
      <View style={styles.sectionGuarantees}>
        <View style={styles.guaranteesCard}>
          <View style={styles.guaranteesHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#004b4e" />
            <Text style={styles.guaranteesTitle}>Compromiso Pikka</Text>
          </View>
          <Text style={styles.guaranteesBody}>
            Garantizamos la máxima calidad y presentación en cada pedido. Si algo no llega como
            lo esperabas, nos encargamos de solucionarlo de inmediato.
          </Text>
        </View>
      </View>

      {/* 5. Product details modal */}
      <ProductDetailModal
        visible={selectedProduct !== null}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOrder={(prod) => {
          setSelectedProduct(null)
          onOrderProduct?.(prod)
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 90,
    backgroundColor: '#effcff',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  // 1. Refined Hero Card
  sectionHero: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#003232',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    gap: 14,
  },
  headlineGroup: {
    gap: 6,
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#004b4e',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#3f4949',
    lineHeight: 19,
  },
  heroActions: {
    flexDirection: 'row',
  },
  exploreBtn: {
    flex: 1,
    backgroundColor: '#004b4e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#004b4e',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // 2. Filter Pills
  sectionFilters: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  filterHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#004b4e',
  },
  filterSubtitle: {
    fontSize: 11,
    color: '#6f7979',
    marginTop: 1,
  },
  filterBar: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#dff8ff',
  },
  filterChipActive: {
    backgroundColor: '#004b4e',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3f4949',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // 3. Product Catalog Cards
  sectionProducts: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#3f4949',
    fontWeight: '500',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#003232',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  productAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  productImageWrapper: {
    width: 88,
    height: 88,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#d9f2f9',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productRef: {
    fontSize: 9,
    fontWeight: '800',
    color: '#006b5f',
    letterSpacing: 0.5,
  },
  mapHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dff8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mapHintText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#006b5f',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#004b4e',
    marginTop: 2,
  },
  productSubtitle: {
    fontSize: 11,
    color: '#6f7979',
    marginTop: 1,
  },
  productBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#061f23',
  },
  productNote: {
    fontSize: 8,
    fontWeight: '600',
    color: '#3f4949',
    letterSpacing: 0.4,
  },
  orderBtn: {
    backgroundColor: '#006b5f',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  orderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // 4. Quality Guarantee Card
  sectionGuarantees: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  guaranteesCard: {
    backgroundColor: '#d9f2f9',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  guaranteesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guaranteesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#004b4e',
  },
  guaranteesBody: {
    fontSize: 11,
    color: '#3f4949',
    lineHeight: 16,
  },
})
