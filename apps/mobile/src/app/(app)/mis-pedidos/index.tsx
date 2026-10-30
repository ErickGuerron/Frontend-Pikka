import { useEffect, useState } from 'react'
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { isDemoMode } from '../../../api/config'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import {
  normalizePhone,
  sanitizePhoneInput,
  validateCity,
  validatePhone,
} from '../../../features/contact/validation'
import { CustomerBottomNav } from '../../../features/customer-catalog/CustomerBottomNav'
import { CustomerCatalogView } from '../../../features/customer-catalog/CustomerCatalogView'
import { CustomerHeader } from '../../../features/customer-catalog/CustomerHeader'
import type { CatalogProduct, CustomerTab } from '../../../features/customer-catalog/types'
import { BalanceCard } from '../../../features/customer-orders/BalanceCard'
import { useMyBalance, usePayBalance } from '../../../features/customer-orders/balance-hooks'
import { useMyNotifications } from '../../../features/customer-orders/notifications-hooks'
import { NotificationsPanel } from '../../../features/customer-orders/NotificationsPanel'
import { CurrentOrderCard } from '../../../features/customer-orders/CurrentOrderCard'
import { useMyOrders } from '../../../features/customer-orders/hooks'
import { OrderHistory } from '../../../features/customer-orders/OrderHistory'
import { useOrdersStore } from '../../../features/customer-orders/orders-store'
import { pickCurrentOrder } from '../../../features/customer-orders/types'
import { useSessionStore } from '../../../store/session-store'
import { colors } from '../../../theme/colors'

export default function CustomerMainScreen() {
  const [activeTab, setActiveTab] = useState<CustomerTab>('catalogo')
  const { orders, loading, refreshing, error, unavailable, load } = useMyOrders()
  const user = useSessionStore((s) => s.user)
  const updateUser = useSessionStore((s) => s.updateUser)
  const clear = useSessionStore((s) => s.clear)
  const current = pickCurrentOrder(orders)

  // What the customer owes (ADR 0006). An account blocked for the balance cannot create orders; the server
  // rejects it too. After paying, the balance and the orders are reloaded.
  const { balance, reload: reloadBalance } = useMyBalance()
  const payment = usePayBalance(() => {
    reloadBalance()
    void load('refresh')
  })
  const blocked = balance?.blocked === true
  const { notifications } = useMyNotifications()

  // Account editing state
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [phone, setPhone] = useState(user?.phone ?? '+593 99-123-4567')
  const [city, setCity] = useState(user?.city ?? 'Quito, Ecuador')
  const [contactErrors, setContactErrors] = useState<{ phone?: string; city?: string }>({})
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (user?.phone) setPhone(user.phone)
    if (user?.city) setCity(user.city)
  }, [user?.phone, user?.city])

  const handleOrderProduct = (product: CatalogProduct) => {
    router.push({ pathname: '/mis-pedidos/nuevo', params: { productId: product.id } })
  }

  const handleExploreCatalog = () => {
    router.push('/mis-pedidos/nuevo')
  }

  const handleSaveContact = async () => {
    const phoneErr = validatePhone(phone)
    const cityErr = validateCity(city)

    if (phoneErr || cityErr) {
      setContactErrors({ phone: phoneErr, city: cityErr })
      return
    }

    setContactErrors({})
    const cleanPhone = normalizePhone(phone.trim())
    const cleanCity = city.trim()

    await updateUser({ phone: cleanPhone, city: cleanCity })
    setSaveSuccessMsg('Datos guardados correctamente.')
    setIsEditingContact(false)

    setTimeout(() => {
      setSaveSuccessMsg(null)
    }, 3500)
  }

  const handleCancelContact = () => {
    setPhone(user?.phone ?? '+593 99-123-4567')
    setCity(user?.city ?? 'Quito, Ecuador')
    setContactErrors({})
    setIsEditingContact(false)
  }

  const handleLogout = () => {
    useOrdersStore.getState().reset()
    void clear()
  }

  return (
    <View style={styles.screen}>
      {/* Clean Top Header: Brand Logo + Avatar */}
      <CustomerHeader onPressProfile={() => setActiveTab('cuenta')} />

      {/* Main Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'catalogo' ? (
          <CustomerCatalogView
            orders={orders}
            onOrderProduct={handleOrderProduct}
            onExploreCatalog={handleExploreCatalog}
          />
        ) : null}

        {activeTab === 'pedidos' ? (
          <ScrollView
            contentContainerStyle={styles.ordersScroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void load('refresh') }} />}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.ordersHeader}>
              <View>
                <Text style={styles.ordersTitle}>Mis Pedidos</Text>
                <Text style={styles.ordersSubtitle}>Gestiona y rastrea tus entregas en curso</Text>
              </View>
              {isDemoMode() ? <Text style={styles.demoBadge}>DEMO</Text> : null}
            </View>

            <NotificationsPanel notifications={notifications} />

            <BalanceCard
              balance={balance}
              paying={payment.paying}
              outcome={payment.outcome}
              onPay={() => { void payment.pay() }}
              onDismissOutcome={payment.dismiss}
            />

            <Button
              label="Hacer nuevo pedido"
              disabled={unavailable || blocked}
              onPress={() => { router.push('/mis-pedidos/nuevo') }}
              rightIcon={<Ionicons name="add" size={18} color="#ffffff" />}
            />

            {loading ? <Text style={styles.infoText}>Cargando pedidos…</Text> : null}
            {error ? (
              <Text accessibilityRole="alert" style={styles.errorAlert}>
                {unavailable ? error : `No pudimos cargar tus pedidos. ${error}`}
              </Text>
            ) : null}

            {!loading && !error && current === null ? (
              <View style={styles.emptyCard}>
                <Ionicons name="cube-outline" size={40} color="#006b5f" />
                <Text style={styles.emptyTitle}>No tienes pedidos activos</Text>
                <Text style={styles.emptySubtitle}>Explora el catálogo o realiza un nuevo pedido para comenzar.</Text>
              </View>
            ) : null}

            {current ? <CurrentOrderCard order={current} cancelBlocked={blocked} /> : null}
            {!unavailable && !loading ? <OrderHistory orders={orders} /> : null}
          </ScrollView>
        ) : null}

        {activeTab === 'cuenta' ? (
          <ScrollView contentContainerStyle={styles.cuentaScroll} showsVerticalScrollIndicator={false}>
            {/* User Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={36} color="#004b4e" />
              </View>
              <Text style={styles.profileName}>{user?.fullName ?? 'Cliente Pikka'}</Text>
              <Text style={styles.profileEmail}>{user?.email ?? 'cliente@pikka.com'}</Text>
              <View style={styles.roleChip}>
                <Text style={styles.roleText}>{user?.role ?? 'CUSTOMER'}</Text>
              </View>
            </View>

            {/* Editable Contact Details Card */}
            <View style={styles.detailsCard}>
              <View style={styles.detailsHeaderRow}>
                <View style={styles.detailsTitleGroup}>
                  <Ionicons name="information-circle-outline" size={18} color="#004b4e" />
                  <Text style={styles.detailsTitle}>Datos de Contacto</Text>
                </View>
                {!isEditingContact ? (
                  <Button
                    label="Modificar"
                    variant="outline"
                    onPress={() => setIsEditingContact(true)}
                    rightIcon={<Ionicons name="create-outline" size={15} color="#004b4e" />}
                  />
                ) : null}
              </View>

              {saveSuccessMsg ? (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={16} color="#006b5f" />
                  <Text style={styles.successBannerText}>{saveSuccessMsg}</Text>
                </View>
              ) : null}

              {!isEditingContact ? (
                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Teléfono</Text>
                    <Text style={styles.detailValue}>{phone || 'No registrado'}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ciudad</Text>
                    <Text style={styles.detailValue}>{city || 'No registrada'}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.editForm}>
                  <Field
                    label="Teléfono"
                    value={phone}
                    onChangeText={(text) => setPhone(sanitizePhoneInput(text))}
                    error={contactErrors.phone}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    leftIcon={<Ionicons name="call-outline" size={18} color="#006b5f" />}
                  />

                  <Field
                    label="Ciudad"
                    value={city}
                    onChangeText={setCity}
                    error={contactErrors.city}
                    placeholder="Ej. Quito, Guayaquil..."
                    leftIcon={<Ionicons name="location-outline" size={18} color="#006b5f" />}
                  />

                  <View style={styles.formActions}>
                    <Button
                      label="Guardar cambios"
                      onPress={handleSaveContact}
                      rightIcon={<Ionicons name="save-outline" size={16} color="#ffffff" />}
                    />
                    <Button
                      label="Cancelar"
                      variant="outline"
                      onPress={handleCancelContact}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Logout Action */}
            <Button
              label="Cerrar sesión"
              variant="outline"
              onPress={handleLogout}
              rightIcon={<Ionicons name="log-out-outline" size={17} color="#ba1a1a" />}
            />
          </ScrollView>
        ) : null}
      </View>

      {/* Fixed Bottom Navigation: Exactly 3 Tabs */}
      <CustomerBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        ordersCount={orders.length > 0 ? orders.length : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#effcff',
  },
  tabContent: {
    flex: 1,
  },
  ordersScroll: {
    padding: 16,
    paddingBottom: 90,
    gap: 16,
  },
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ordersTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#004b4e',
  },
  ordersSubtitle: {
    fontSize: 12,
    color: '#3f4949',
    marginTop: 2,
  },
  demoBadge: {
    backgroundColor: '#fff3cd',
    color: '#664d03',
    fontWeight: '700',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  infoText: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginVertical: 12,
  },
  errorAlert: {
    color: colors.onErrorContainer,
    backgroundColor: colors.errorContainer,
    borderRadius: 10,
    padding: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#003232',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    marginVertical: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#004b4e',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#3f4949',
    textAlign: 'center',
  },

  // Cuenta View
  cuentaScroll: {
    padding: 16,
    paddingBottom: 90,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#003232',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#dff8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#a5eff2',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#004b4e',
  },
  profileEmail: {
    fontSize: 12,
    color: '#3f4949',
  },
  roleChip: {
    backgroundColor: 'rgba(107, 249, 228, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#006b5f',
    letterSpacing: 0.8,
  },
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
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  detailsTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#004b4e',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dff8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#006b5f',
  },
  detailsList: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6f7979',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#061f23',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(190, 200, 200, 0.3)',
  },
  editForm: {
    gap: 12,
    paddingTop: 4,
  },
  formActions: {
    gap: 8,
    marginTop: 6,
  },
})
