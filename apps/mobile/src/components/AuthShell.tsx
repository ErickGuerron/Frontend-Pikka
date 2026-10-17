import type { ReactNode } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

interface Props {
  mode?: 'login' | 'signup'
  title?: string
  subtitle?: string
  children: ReactNode
}

/**
 * Mobile authentication layout based on the Pikka Mobile Design Prototype:
 * Ambient gradient background with soft glowing orbs, decorative dotted SVG curves,
 * floating mascot with halo, security badge, official wordmark, and a bottom sheet card
 * with drag handle, form content, and security footer.
 */
export function AuthShell({ mode = 'login', children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Ambient background decorations */}
      <View style={styles.ambientContainer} pointerEvents="none">
        <View style={styles.orbTop} />
        <View style={styles.orbLeft} />
        <View style={styles.orbRight} />
        <Svg style={styles.ambientSvg} viewBox="0 0 400 130">
          <Path
            d="M-20 65 C 70 15, 160 105, 250 45 C 320 -5, 370 60, 420 35"
            stroke="#0d9488"
            strokeDasharray="4 6"
            strokeWidth={1.5}
            opacity={0.3}
            fill="none"
          />
          <Path
            d="M-10 85 C 90 35, 180 120, 270 60 C 340 15, 380 80, 430 55"
            stroke="#14b8a6"
            strokeDasharray="3 5"
            strokeWidth={1}
            opacity={0.25}
            fill="none"
          />
        </Svg>
        {/* Subtle decorative floating particles */}
        <View style={styles.bubble1} />
        <View style={styles.bubble2} />
        <View style={styles.bubble3} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Mascot and Brand Section */}
          <View style={styles.hero}>
            {/* Security Pill */}
            <View style={styles.securityPill}>
              <View style={styles.securityDot} />
              <Text style={styles.securityText}>ACCESO SEGURO PIKKA</Text>
            </View>

            {/* Mascot Container with glowing halo */}
            <View style={styles.mascotWrapper}>
              <View style={styles.mascotHalo} />
              <Image
                source={require('../../assets/pikka.png')}
                style={styles.mascotImage}
                resizeMode="contain"
                accessibilityLabel="Nutria mensajera Pikka"
              />
            </View>

            {/* Official Pikka Wordmark with turquoise dot above 'i' */}
            <View style={styles.logoRow}>
              <Text style={styles.logoText}>P</Text>
              <View style={styles.iWrapper}>
                <View style={styles.iDot} />
                <Text style={styles.logoText}>ı</Text>
              </View>
              <Text style={styles.logoText}>kka</Text>
            </View>
            <Text style={styles.tagline}>Tus entregas y pedidos en un solo lugar</Text>
          </View>

          {/* Bottom Sheet Modal Card */}
          <View style={styles.bottomSheetCard}>
            {/* Drag Handle Accent */}
            <View style={styles.dragHandle} />

            {/* Form Content */}
            {children}

            {/* Bottom Sheet Footer Badge */}
            <View style={styles.sheetFooter}>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>v2.4</Text>
              <Text style={styles.footerDivider}>•</Text>
              <Text style={styles.footerText}>Red segura Pikka Logistics</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0fbf9' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  ambientContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  orbTop: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(204, 251, 241, 0.65)',
  },
  orbLeft: {
    position: 'absolute',
    top: 120,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(209, 250, 229, 0.45)',
  },
  orbRight: {
    position: 'absolute',
    top: 160,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(204, 251, 241, 0.55)',
  },
  ambientSvg: {
    position: 'absolute',
    top: 28,
    left: 0,
    right: 0,
    width: '100%',
    height: 120,
  },
  bubble1: {
    position: 'absolute',
    top: 60,
    left: 40,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(20, 184, 166, 0.45)',
  },
  bubble2: {
    position: 'absolute',
    top: 90,
    right: 50,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(45, 212, 191, 0.4)',
  },
  bubble3: {
    position: 'absolute',
    top: 150,
    right: 30,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(20, 184, 166, 0.35)',
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 16,
    minHeight: 310,
    gap: 4,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(204, 251, 241, 0.85)',
    borderWidth: 1,
    borderColor: '#99f6e4',
    marginBottom: 6,
  },
  securityDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#14b8a6',
  },
  securityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#0a4c4e',
    textTransform: 'uppercase',
  },
  mascotWrapper: {
    position: 'relative',
    width: 130,
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  mascotHalo: {
    position: 'absolute',
    width: 100,
    height: 80,
    borderRadius: 45,
    backgroundColor: 'rgba(153, 246, 228, 0.6)',
  },
  mascotImage: { width: 120, height: 90 },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#004b4e',
    letterSpacing: -0.5,
  },
  iWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  iDot: {
    position: 'absolute',
    top: 3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#14b8a6',
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f766e',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  bottomSheetCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(204, 251, 241, 0.8)',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#003232',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingTop: 12,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#14b8a6',
  },
  footerText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  footerDivider: {
    fontSize: 10,
    color: '#cbd5e1',
  },
})
