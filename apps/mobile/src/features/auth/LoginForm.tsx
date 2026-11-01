import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { colors } from '../../theme/colors'
import { useSessionStore } from '../../store/session-store'
import { login } from './api'
import { isMobileRole, NON_MOBILE_MESSAGE } from './guards'
import { loginErrorMessage } from './login-error'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setSession = useSessionStore((s) => s.setSession)

  const submit = async () => {
    if (email.trim() === '' || password.trim() === '') {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const result = await login(email.trim(), password)
      if (!isMobileRole(result.user.role)) {
        // This app serves only customers and drivers: never keep a staff session.
        setError(NON_MOBILE_MESSAGE)
        return
      }
      // The (auth) layout redirects to /mis-pedidos as soon as the session exists.
      await setSession(result.accessToken, result.user, result.expiresIn)
    } catch (e) {
      setError(loginErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.form}>
      <Field
        label="Correo electrónico"
        placeholder="operador@pikka.io o cliente@..."
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!loading}
        leftIcon={<Ionicons name="at-outline" size={18} color="#0f766e" />}
      />

      <Field
        label="Contraseña"
        placeholder="••••••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        editable={!loading}
        leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#0f766e" />}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => { setShowPassword((v) => !v) }}
            hitSlop={8}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#0f766e"
            />
          </Pressable>
        }
      />

      {/* Row: Remember me & Forgot Password */}
      <View style={styles.rememberForgotRow}>
        <Pressable
          style={styles.checkboxRow}
          onPress={() => { setRemember((r) => !r) }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remember }}
        >
          <View style={[styles.checkbox, remember ? styles.checkboxChecked : null]}>
            {remember ? <Ionicons name="checkmark" size={11} color="#ffffff" /> : null}
          </View>
          <Text style={styles.rememberText}>Recordarme</Text>
        </Pressable>

        <Pressable hitSlop={6}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </Pressable>
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      {/* Main Submit Button */}
      <Button
        label="Iniciar sesión"
        onPress={() => { void submit() }}
        loading={loading}
        rightIcon={<Ionicons name="arrow-forward" size={16} color="#ffffff" />}
      />
      {/* Switch to Signup Link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Aún no tienes cuenta? </Text>
        <Link href="/signup" style={styles.link}>
          Regístrate gratis
        </Link>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  eyeBtn: { padding: 4 },
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#004b4e',
    borderColor: '#004b4e',
  },
  rememberText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 12,
    color: '#0f766e',
    fontWeight: '700',
  },
  error: {
    color: colors.error,
    backgroundColor: colors.errorContainer,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
  },
  link: {
    color: '#004b4e',
    fontWeight: '700',
    fontSize: 12,
  },
})
