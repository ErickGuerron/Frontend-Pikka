import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { userMessage } from '../../api/errors'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { colors } from '../../theme/colors'
import { useSessionStore } from '../../store/session-store'
import { signup } from './api'
import { PasswordStrength } from './PasswordStrength'
import { joinFullName, MAX_NAME_PART, validateSignup, type SignupErrors, type SignupValues } from './signup-validation'

const empty: SignupValues = { nombre: '', apellido: '', email: '', password: '', confirm: '' }

export function SignupForm() {
  const [values, setValues] = useState<SignupValues>(empty)
  const [errors, setErrors] = useState<SignupErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const setSession = useSessionStore((s) => s.setSession)

  const set = (key: keyof SignupValues) => (text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }))
  }

  const submit = async () => {
    setServerError(null)
    const found = validateSignup(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setLoading(true)
    try {
      const result = await signup({
        email: values.email.trim(),
        password: values.password,
        fullName: joinFullName(values.nombre, values.apellido),
      })
      // The (auth) layout redirects to /mis-pedidos as soon as the session exists.
      await setSession(result.accessToken, result.user)
    } catch (error) {
      setServerError(userMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.form}>
      <Field label="Nombre" value={values.nombre} onChangeText={set('nombre')} error={errors.nombre} maxLength={MAX_NAME_PART} autoComplete="given-name" textContentType="givenName" editable={!loading} />
      <Field label="Apellido" value={values.apellido} onChangeText={set('apellido')} error={errors.apellido} maxLength={MAX_NAME_PART} autoComplete="family-name" textContentType="familyName" editable={!loading} />
      <Field label="Correo electrónico" value={values.email} onChangeText={set('email')} error={errors.email} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" editable={!loading} />
      <Field
        label="Contraseña"
        value={values.password}
        onChangeText={set('password')}
        error={errors.password}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!loading}
        right={<ToggleVisibility visible={showPassword} onToggle={() => { setShowPassword((v) => !v) }} />}
      />
      <PasswordStrength password={values.password} />
      <Field label="Confirmar contraseña" value={values.confirm} onChangeText={set('confirm')} error={errors.confirm} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="new-password" editable={!loading} />
      {serverError ? (
        <Text accessibilityRole="alert" style={styles.serverError}>
          {serverError}
        </Text>
      ) : null}
      <Button label="Crear cuenta" onPress={() => { void submit() }} loading={loading} />
      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
        <Link href="/login" style={styles.link}>
          Inicia sesión
        </Link>
      </View>
    </View>
  )
}

export function ToggleVisibility({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={onToggle} hitSlop={8}>
      <Text style={styles.toggle}>{visible ? 'Ocultar' : 'Mostrar'}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  serverError: { color: colors.error, backgroundColor: colors.errorContainer, borderRadius: 8, padding: 10, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: colors.onSurfaceVariant },
  link: { color: colors.primary, fontWeight: '700' },
  toggle: { color: colors.primary, fontWeight: '700', fontSize: 13 },
})
