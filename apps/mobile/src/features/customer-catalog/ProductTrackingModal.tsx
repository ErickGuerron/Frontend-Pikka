import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { useSessionStore } from '../../store/session-store'
import type { CatalogProduct } from './types'

interface Props {
  visible: boolean
  onClose: () => void
  product: CatalogProduct | null
  onOrder?: (product: CatalogProduct) => void
}

export function ProductTrackingModal({
  visible,
  onClose,
  product,
  onOrder,
}: Props) {
  const user = useSessionStore((s) => s.user)

  if (!product) return null

  const orderCode = `#PK-${product.id.slice(-4).toUpperCase()}`
  const userCity = user?.city ?? 'Santiago'
  const userAddress = `Av. Providencia 1345, ${userCity}`

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Detalle del Pedido</Text>
            <Text style={styles.headerSubtitle}>Seguimiento y telemetría de ruta</Text>
          </View>
          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar detalle del pedido"
          >
            <Ionicons name="close" size={20} color="#004b4e" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Product Summary Card */}
          <View style={styles.productSummaryCard}>
            <View style={styles.productImageWrapper}>
              {product.imageUrl ? (
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="cube-outline" size={28} color="#006b5f" />
                </View>
              )}
            </View>

            <View style={styles.productInfo}>
              <View style={styles.orderBadgeRow}>
                <Text style={styles.orderCode}>{orderCode}</Text>
                <View style={styles.statusPill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.statusPillText}>EN RUTA</Text>
                </View>
              </View>

              <Text style={styles.productTitle} numberOfLines={1}>
                {product.title}
              </Text>
              <Text style={styles.productSubtitle} numberOfLines={1}>
                {product.subtitle}
              </Text>

              <Text style={styles.productPrice}>{product.price}</Text>
            </View>
          </View>

          {/* 2. Order Timeline Stepper */}
          <View style={styles.stepperCard}>
            <Text style={styles.sectionHeading}>Estado del Despacho</Text>

            <View style={styles.stepperRow}>
              {/* Step 1: Confirmado */}
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepDotDone]}>
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                </View>
                <Text style={styles.stepLabelDone}>Confirmado</Text>
              </View>

              <View style={[styles.stepLine, styles.stepLineDone]} />

              {/* Step 2: Preparado */}
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepDotDone]}>
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                </View>
                <Text style={styles.stepLabelDone}>Preparado</Text>
              </View>

              <View style={[styles.stepLine, styles.stepLineDone]} />

              {/* Step 3: En camino (Activo) */}
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepDotActive]}>
                  <View style={styles.pulseInner} />
                </View>
                <Text style={styles.stepLabelActive}>En camino</Text>
              </View>

              <View style={styles.stepLine} />

              {/* Step 4: Entregado */}
              <View style={styles.stepItem}>
                <View style={styles.stepDot}>
                  <View style={styles.stepDotIdle} />
                </View>
                <Text style={styles.stepLabel}>Entregado</Text>
              </View>
            </View>
          </View>

          {/* 3. Interactive Vector Tracking Map (Demo) */}
          <View style={styles.mapCard}>
            <View style={styles.mapHeaderRow}>
              <View style={styles.mapTitleGroup}>
                <Ionicons name="navigate-circle" size={18} color="#48dcc8" />
                <Text style={styles.mapTitle}>Mapa de Ruta en Vivo (Demo)</Text>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveBadgeText}>ONLINE</Text>
              </View>
            </View>

            {/* Map Canvas */}
            <View style={styles.mapCanvasWrapper}>
              <Svg width="100%" height={210} viewBox="0 0 340 210">
                <Defs>
                  <LinearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#006b5f" stopOpacity="0.8" />
                    <Stop offset="0.6" stopColor="#48dcc8" stopOpacity="1" />
                    <Stop offset="1" stopColor="#6bf9e4" stopOpacity="1" />
                  </LinearGradient>
                  <LinearGradient id="mapBg" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#081c20" />
                    <Stop offset="1" stopColor="#0e2a30" />
                  </LinearGradient>
                </Defs>

                {/* Dark Cartographic Background */}
                <Rect x="0" y="0" width="340" height="210" rx="14" fill="url(#mapBg)" />

                {/* Secondary Street Grid Network */}
                <Line x1="10" y1="45" x2="330" y2="45" stroke="#163940" strokeWidth="1" strokeDasharray="3 3" />
                <Line x1="10" y1="95" x2="330" y2="95" stroke="#163940" strokeWidth="1" strokeDasharray="3 3" />
                <Line x1="10" y1="145" x2="330" y2="145" stroke="#163940" strokeWidth="1" strokeDasharray="3 3" />
                <Line x1="70" y1="10" x2="70" y2="200" stroke="#163940" strokeWidth="1" strokeDasharray="3 3" />
                <Line x1="170" y1="10" x2="170" y2="200" stroke="#163940" strokeWidth="1" strokeDasharray="3 3" />
                <Line x1="270" y1="10" x2="270" y2="200" stroke="#163940" strokeWidth="1" strokeDasharray="3 3" />

                {/* Major Avenues (Road corridors) */}
                <Path
                  d="M 20 170 Q 100 165 140 135 T 230 95 T 320 50"
                  stroke="#1b4952"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Active Delivery Route with Glowing Gradient */}
                <Path
                  d="M 45 160 Q 115 150 160 120 T 235 85 T 295 55"
                  stroke="url(#routeGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Remaining Trajectory (Dashed) */}
                <Path
                  d="M 185 108 Q 230 85 295 55"
                  stroke="#6bf9e4"
                  strokeWidth="3"
                  strokeDasharray="5 4"
                  fill="none"
                />

                {/* Origin Marker (Hub Pikka) */}
                <G>
                  <Circle cx="45" cy="160" r="10" fill="#004b4e" stroke="#48dcc8" strokeWidth="2" />
                  <Circle cx="45" cy="160" r="4" fill="#ffffff" />
                  <SvgText x="45" y="185" fill="#cee7ed" fontSize="10" fontWeight="700" textAnchor="middle">
                    Hub Pikka
                  </SvgText>
                </G>

                {/* Destination Marker (Tu Domicilio) */}
                <G>
                  <Circle cx="295" cy="55" r="10" fill="#ba1a1a" stroke="#ffffff" strokeWidth="2" />
                  <Circle cx="295" cy="55" r="4" fill="#ffffff" />
                  <SvgText x="295" y="80" fill="#cee7ed" fontSize="10" fontWeight="700" textAnchor="middle">
                    Tu Domicilio
                  </SvgText>
                </G>

                {/* Courier Courier Marker (Moving Along Route) */}
                <G>
                  {/* Pulsing Aura */}
                  <Circle cx="185" cy="108" r="16" fill="rgba(72, 220, 200, 0.25)" />
                  <Circle cx="185" cy="108" r="9" fill="#006b5f" stroke="#ffffff" strokeWidth="2" />
                  <Circle cx="185" cy="108" r="3.5" fill="#6bf9e4" />
                </G>
              </Svg>

              {/* Floating Live Telemetry HUD Bar */}
              <View style={styles.mapHudOverlay}>
                <View style={styles.hudLeft}>
                  <View style={styles.hudDot} />
                  <Text style={styles.hudRouteText}>Ruta Directa · 1.4 km</Text>
                </View>
                <Text style={styles.hudEtaText}>ETA: 18 MIN</Text>
              </View>
            </View>

            {/* Courier Details Sub-card */}
            <View style={styles.courierRow}>
              <View style={styles.courierAvatar}>
                <Ionicons name="bicycle" size={18} color="#004b4e" />
              </View>
              <View style={styles.courierInfo}>
                <Text style={styles.courierName}>Carlos Méndez</Text>
                <Text style={styles.courierMeta}>Repartidor certificado · Moto Pikka #08</Text>
              </View>
              <View style={styles.speedChip}>
                <Ionicons name="speedometer-outline" size={13} color="#006b5f" />
                <Text style={styles.speedText}>28 km/h</Text>
              </View>
            </View>
          </View>

          {/* 4. Delivery Information Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionHeading}>Datos de Entrega</Text>

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={17} color="#004b4e" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Dirección de entrega</Text>
                <Text style={styles.detailValue}>{userAddress}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={17} color="#004b4e" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ventana estimada</Text>
                <Text style={styles.detailValue}>Hoy · 15:00 a 18:00 hrs</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Ionicons name="key-outline" size={17} color="#004b4e" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>PIN de recepción segura</Text>
                <Text style={[styles.detailValue, { letterSpacing: 2, color: '#006b5f' }]}>
                  8492
                </Text>
              </View>
            </View>
          </View>

          {/* 5. Primary Order Action */}
          <View style={styles.actionsGroup}>
            <Pressable
              style={({ pressed }) => [styles.primaryOrderBtn, pressed && styles.btnPressed]}
              onPress={() => {
                onClose()
                onOrder?.(product)
              }}
              accessibilityRole="button"
              accessibilityLabel={`Hacer pedido de ${product.title}`}
            >
              <Text style={styles.primaryOrderBtnText}>Hacer pedido de este producto</Text>
              <Ionicons name="arrow-forward" size={17} color="#ffffff" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Volver al catálogo"
            >
              <Text style={styles.secondaryBtnText}>Volver al catálogo</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#effcff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 42, 47, 0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#004b4e',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6f7979',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dff8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },

  // 1. Product Summary Card
  productSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 14,
    shadowColor: '#003232',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  productImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#d9f2f9',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006b5f',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(72, 220, 200, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#006b5f',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#006b5f',
    letterSpacing: 0.5,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#004b4e',
    marginTop: 2,
  },
  productSubtitle: {
    fontSize: 11,
    color: '#6f7979',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#061f23',
    marginTop: 2,
  },

  // 2. Stepper Card
  stepperCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#003232',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#004b4e',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#006b5f',
  },
  stepDotActive: {
    backgroundColor: '#48dcc8',
  },
  pulseInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#004b4e',
  },
  stepDotIdle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepLineDone: {
    backgroundColor: '#006b5f',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94a3b8',
  },
  stepLabelDone: {
    fontSize: 10,
    fontWeight: '600',
    color: '#004b4e',
  },
  stepLabelActive: {
    fontSize: 10,
    fontWeight: '800',
    color: '#006b5f',
  },

  // 3. Map Card
  mapCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#003232',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#004b4e',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(72, 220, 200, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#006b5f',
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#006b5f',
  },
  mapCanvasWrapper: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  mapHudOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(8, 28, 32, 0.88)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(72, 220, 200, 0.2)',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#48dcc8',
  },
  hudRouteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  hudEtaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6bf9e4',
  },
  courierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fbfb',
    borderRadius: 12,
    padding: 10,
  },
  courierAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dff8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierInfo: {
    flex: 1,
  },
  courierName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004b4e',
  },
  courierMeta: {
    fontSize: 10,
    color: '#6f7979',
  },
  speedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#006b5f',
  },

  // 4. Details Card
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#003232',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#6f7979',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#061f23',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(190, 200, 200, 0.3)',
  },

  // Actions
  actionsGroup: {
    gap: 10,
    marginTop: 4,
  },
  primaryOrderBtn: {
    backgroundColor: '#004b4e',
    borderRadius: 12,
    paddingVertical: 14,
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
  primaryOrderBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dff8ff',
  },
  secondaryBtnText: {
    color: '#004b4e',
    fontSize: 13,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
})
