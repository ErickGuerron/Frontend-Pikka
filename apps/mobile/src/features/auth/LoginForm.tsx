import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { userMessage } from '../../api/errors'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { colors } from '../../theme/colors'
import { useSessionStore } from '../../store/session-store'
import { login } from './api'
import { isCustomerRole, NON_CUSTOMER_MESSAGE } from './guards'
import { ToggleVisibility } from './SignupForm'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setSession = useSessionStore((s) => s.setSession)

  const submit = async () => {
    if (email.trim() === '' || password === '') {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const result = await login(email.trim(), password)
      if (!isCustomerRole(result.user.role)) {
        // This build is customers-only: never keep a staff/driver session.
        setError(NON_CUSTOMER_MESSAGE)
        return
      }
      // The (auth) layout redirects to /mis-pedidos as soon as the session exists.
      await setSession(result.accessToken, result.user)
    } catch (e) {
      setError(userMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.form}>
      <Field label="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" editable={!loading} />
      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        editable={!loading}
        right={<ToggleVisibility visible={showPassword} onToggle={() => { setShowPassword((v) => !v) }} />}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button label="Iniciar sesión" onPress={() => { void submit() }} loading={loading} />
      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No tienes cuenta? </Text>
        <Link href="/signup" style={styles.link}>
          Regístrate
        </Link>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  error: { color: colors.error, backgroundColor: colors.errorContainer, borderRadius: 8, padding: 10, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: colors.onSurfaceVariant },
  link: { color: colors.primary, fontWeight: '700' },
})
