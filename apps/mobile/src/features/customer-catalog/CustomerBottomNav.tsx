import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { CustomerTab } from './types'

interface Props {
  activeTab: CustomerTab
  onSelectTab: (tab: CustomerTab) => void
  ordersCount?: number
}

export function CustomerBottomNav({ activeTab, onSelectTab, ordersCount }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.navRow}>
        {/* Tab 1: Catálogo */}
        <Pressable
          style={styles.tabItem}
          onPress={() => onSelectTab('catalogo')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'catalogo' }}
          accessibilityLabel="Catálogo"
        >
          <Ionicons
            name={activeTab === 'catalogo' ? 'grid' : 'grid-outline'}
            size={22}
            color={activeTab === 'catalogo' ? '#004b4e' : '#6f7979'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'catalogo' ? styles.tabLabelActive : null,
            ]}
          >
            Catálogo
          </Text>
        </Pressable>

        {/* Tab 2: Pedidos */}
        <Pressable
          style={styles.tabItem}
          onPress={() => onSelectTab('pedidos')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'pedidos' }}
          accessibilityLabel="Pedidos"
        >
          <View style={styles.iconWithBadge}>
            <Ionicons
              name={activeTab === 'pedidos' ? 'cube' : 'cube-outline'}
              size={22}
              color={activeTab === 'pedidos' ? '#004b4e' : '#6f7979'}
            />
            {typeof ordersCount === 'number' && ordersCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{ordersCount}</Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'pedidos' ? styles.tabLabelActive : null,
            ]}
          >
            Pedidos
          </Text>
        </Pressable>

        {/* Tab 3: Cuenta */}
        <Pressable
          style={styles.tabItem}
          onPress={() => onSelectTab('cuenta')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'cuenta' }}
          accessibilityLabel="Cuenta"
        >
          <Ionicons
            name={activeTab === 'cuenta' ? 'person-circle' : 'person-circle-outline'}
            size={23}
            color={activeTab === 'cuenta' ? '#004b4e' : '#6f7979'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'cuenta' ? styles.tabLabelActive : null,
            ]}
          >
            Cuenta
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239, 252, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(19, 42, 47, 0.08)',
    shadowColor: '#132a2f',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 12,
    zIndex: 50,
  },
  navRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  tabItem: {
    minWidth: 70,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6f7979',
  },
  tabLabelActive: {
    color: '#004b4e',
    fontWeight: '700',
  },
  iconWithBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#006b5f',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
})
