import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { CatalogProduct } from './types'

interface Props {
  visible: boolean
  onClose: () => void
  product: CatalogProduct | null
  onOrder?: (product: CatalogProduct) => void
}

export function ProductDetailModal({ visible, onClose, product, onOrder }: Props) {
  if (!product) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Detalle del producto</Text>
          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar detalle"
          >
            <Ionicons name="close" size={22} color="#004b4e" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
          <Text style={styles.ref}>{product.ref}</Text>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.subtitle}>{product.subtitle}</Text>
          <Text style={styles.price}>{product.price}</Text>
          <Text style={styles.note}>{product.note}</Text>
        </ScrollView>

        <Pressable
          style={({ pressed }) => [styles.orderBtn, pressed && styles.pressed]}
          onPress={() => onOrder?.(product)}
          accessibilityRole="button"
          accessibilityLabel={`Pedir ${product.title}`}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.orderBtnText}>Pedir</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0fbfc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#004b4e' },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d5f3f5',
  },
  content: { padding: 20, gap: 6 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 20, marginBottom: 12 },
  ref: { fontSize: 12, fontWeight: '700', color: '#006b5f' },
  title: { fontSize: 24, fontWeight: '800', color: '#0b2f31' },
  subtitle: { fontSize: 15, color: '#4a6a6c' },
  price: { fontSize: 26, fontWeight: '800', color: '#0b2f31', marginTop: 8 },
  note: { fontSize: 13, color: '#4a6a6c' },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    margin: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#006b5f',
  },
  orderBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85 },
})
