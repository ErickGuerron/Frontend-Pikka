import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, spacing, borderRadius } from '../theme/colors'
import { useSessionStore } from '../store/session-store'
import { authApi } from '../api/auth'
import { userMessage } from '../api/errors'

type Role = 'despacho' | 'conductor' | 'admin'

interface RoleConfig {
  id: Role
  label: string
  inputLabel: string
  placeholder: string
}

const ROLES: RoleConfig[] = [
  {
    id: 'despacho',
    label: 'Despacho',
    inputLabel: 'CORREO CORPORATIVO / ID CONDUCTOR',
    placeholder: 'ej. despacho.central@pikka.com',
  },
  {
    id: 'conductor',
    label: 'Conductor',
    inputLabel: 'ID CONDUCTOR O TELÉFONO',
    placeholder: 'ej. COND-8492 o +56 9 8765 4321',
  },
  {
    id: 'admin',
    label: 'Admin',
    inputLabel: 'CREDENCIAL DE ADMINISTRADOR',
    placeholder: 'ej. admin.master@pikka.com',
  },
]

export function LoginScreen() {
  const [role, setRole] = useState<Role>('despacho')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setToken = useSessionStore((s) => s.setToken)

  const currentRole = ROLES.find((r) => r.id === role)!

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa tu correo y contraseña.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.login(email.trim(), password)
      setToken(response.token)
      // Navigation would happen here - for now just show success
      Alert.alert('Éxito', 'Has iniciado sesión correctamente.')
    } catch (err) {
      setError(userMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header Hero */}
          <View style={styles.header}>
            {/* Ambient effects */}
            <View style={styles.headerAmbient1} />
            <View style={styles.headerAmbient2} />

            <View style={styles.headerContent}>
              {/* Status Badge */}
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>DISPATCH HUB · RED OPERATIVA ACTIVA</Text>
              </View>

              {/* Mascot */}
              <View style={styles.mascotContainer}>
                <Image
                  source={require('../../assets/pikka.png')}
                  style={styles.mascotImage}
                  resizeMode="contain"
                />
              </View>

              {/* Pikka Wordmark */}
              <View style={styles.wordmark}>
                <Text style={styles.wordmarkText}>
                  p<Text style={styles.wordmarkDot}>ı</Text>kka
                </Text>
              </View>

              {/* Brand Slogan */}
              <Text style={styles.slogan}>Tus pedidos, en buenas manos</Text>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            {/* Welcome */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>¡Bienvenido de nuevo!</Text>
              <Text style={styles.welcomeSubtitle}>
                Ingresa para gestionar tus envíos, rastrear pedidos o acceder a tu panel de despacho.
              </Text>
            </View>

            {/* Error Alert */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              {/* Email / ID Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{currentRole.inputLabel}</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="at"
                    size={20}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={currentRole.placeholder}
                    placeholderTextColor={colors.outline}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.passwordHeader}>
                  <Text style={styles.inputLabel}>CONTRASEÑA</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="lock"
                    size={20}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••••••"
                    placeholderTextColor={colors.outline}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.outline}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember & MFA Row */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <MaterialCommunityIcons name="check" size={14} color={colors.onPrimary} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Recordar sesión</Text>
                </TouchableOpacity>

                <View style={styles.mfaBadge}>
                  <MaterialCommunityIcons name="shield-check" size={14} color={colors.secondary} />
                  <Text style={styles.mfaText}>MFA Activo</Text>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Ingresando…' : 'Iniciar Sesión en Pikka'}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onPrimaryContainer} />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O INGRESA CON</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionButton}>
                <MaterialCommunityIcons name="message-text" size={24} color={colors.primary} />
                <Text style={styles.quickActionText}>Código SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionButton}>
                <MaterialCommunityIcons name="fingerprint" size={24} color={colors.secondary} />
                <Text style={styles.quickActionText}>Biometría / Llave</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.tlsBadge}>
              <MaterialCommunityIcons name="lock" size={14} color={colors.outline} />
              <Text style={styles.tlsText}>Cifrado TLS 256-bit v1.3 · Hub Seguro</Text>
            </View>

            <View style={styles.footerLinks}>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Términos de servicio</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Privacidad</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity style={styles.footerLinkWithIcon}>
                <MaterialCommunityIcons name="headset" size={14} color={colors.secondary} />
                <Text style={styles.footerLink}>Soporte 24/7</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    backgroundColor: colors.primary,
    paddingTop: spacing['space-lg'],
    paddingBottom: spacing['space-xl'] * 1.5,
    paddingHorizontal: spacing['space-md'],
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  headerAmbient1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primaryContainer,
    opacity: 0.4,
  },
  headerAmbient2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.secondaryContainer,
    opacity: 0.2,
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 79, 82, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondaryFixed,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondaryContainer,
    letterSpacing: 0.5,
  },
  mascotContainer: {
    width: 176,
    height: 128,
    marginBottom: 8,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  wordmark: {
    marginBottom: 4,
  },
  wordmarkText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.surfaceContainerLowest,
    letterSpacing: -0.5,
  },
  wordmarkDot: {
    position: 'relative',
  },
  slogan: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onPrimaryContainer,
  },

  // Card
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    marginHorizontal: spacing['space-md'],
    marginTop: -28,
    borderRadius: borderRadius.lg * 2,
    padding: spacing['space-lg'],
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing['space-lg'],
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Error
  errorContainer: {
    backgroundColor: colors.errorContainer,
    padding: 12,
    borderRadius: borderRadius.lg,
    marginBottom: 16,
  },
  errorText: {
    color: colors.onErrorContainer,
    fontSize: 14,
    textAlign: 'center',
  },

  // Form
  form: {
    gap: spacing['space-md'],
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing['space-sm'],
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.onSurface,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPassword: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
  },

  // Options
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  mfaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  mfaText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSecondaryContainer,
    letterSpacing: 0.5,
  },

  // Submit
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryContainer,
    paddingVertical: 14,
    borderRadius: borderRadius.xl,
    marginTop: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing['space-md'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceContainerHighest,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.outline,
    letterSpacing: 1,
    marginHorizontal: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing['space-sm'],
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
    textAlign: 'center',
  },

  // Footer
  footer: {
    marginTop: spacing['space-xl'],
    marginBottom: spacing['space-lg'],
    alignItems: 'center',
    gap: spacing['space-sm'],
  },
  tlsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tlsText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.outline,
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  footerLink: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  footerDot: {
    fontSize: 12,
    color: colors.outlineVariant,
  },
  footerLinkWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
})
