import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { userMessage } from '../../api/errors'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { colors } from '../../theme/colors'
import { useSessionStore } from '../../store/session-store'
import { CITY_MAX, normalizePhone, sanitizePhoneInput } from '../contact/validation'
import { signup } from './api'
import { PasswordStrength } from './PasswordStrength'
import { joinFullName, MAX_NAME_PART, validateSignup, type SignupErrors, type SignupValues } from './signup-validation'

const empty: SignupValues = { nombre: '', apellido: '', city: '', phone: '', email: '', password: '', confirm: '' }

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
        phone: normalizePhone(values.phone.trim()),
        city: values.city.trim(),
      })
      // The (auth) layout redirects to /mis-pedidos as soon as the session exists.
      await setSession(result.accessToken, result.user, result.expiresIn)
    } catch (error) {
      setServerError(userMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.form}>
      <Field
        label="Nombre"
        placeholder="Tu nombre"
        value={values.nombre}
        onChangeText={set('nombre')}
        error={errors.nombre}
        maxLength={MAX_NAME_PART}
        autoComplete="given-name"
        textContentType="givenName"
        editable={!loading}
        leftIcon={<Ionicons name="person-outline" size={18} color="#0f766e" />}
      />

      <Field
        label="Apellido"
        placeholder="Tu apellido"
        value={values.apellido}
        onChangeText={set('apellido')}
        error={errors.apellido}
        maxLength={MAX_NAME_PART}
        autoComplete="family-name"
        textContentType="familyName"
        editable={!loading}
        leftIcon={<Ionicons name="person-outline" size={18} color="#0f766e" />}
      />

      <Field
        label="Ciudad"
        placeholder="Ej. Quito, Guayaquil..."
        value={values.city}
        onChangeText={set('city')}
        error={errors.city}
        maxLength={CITY_MAX}
        autoComplete="postal-address-locality"
        textContentType="addressCity"
        editable={!loading}
        leftIcon={<Ionicons name="location-outline" size={18} color="#0f766e" />}
      />

      <Field
        label="Teléfono"
        placeholder="+593 99-123-4567"
        value={values.phone}
        onChangeText={(text) => { set('phone')(sanitizePhoneInput(text)) }}
        error={errors.phone}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        editable={!loading}
        leftIcon={<Ionicons name="call-outline" size={18} color="#0f766e" />}
      />

      <Field
        label="Correo electrónico"
        placeholder="ejemplo@pikka.io"
        value={values.email}
        onChangeText={set('email')}
        error={errors.email}
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
        value={values.password}
        onChangeText={set('password')}
        error={errors.password}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!loading}
        leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#0f766e" />}
        right={<ToggleVisibility visible={showPassword} onToggle={() => { setShowPassword((v) => !v) }} />}
      />

      <PasswordStrength password={values.password} />

      <Field
        label="Confirmar contraseña"
        placeholder="••••••••••••"
        value={values.confirm}
        onChangeText={set('confirm')}
        error={errors.confirm}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!loading}
        leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#0f766e" />}
      />

      {serverError ? (
        <Text accessibilityRole="alert" style={styles.serverError}>
          {serverError}
        </Text>
      ) : null}

      <Button
        label="Crear cuenta"
        onPress={() => { void submit() }}
        loading={loading}
        rightIcon={<Ionicons name="arrow-forward" size={16} color="#ffffff" />}
      />


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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      onPress={onToggle}
      hitSlop={8}
      style={styles.eyeBtn}
    >
      <Ionicons
        name={visible ? 'eye-off-outline' : 'eye-outline'}
        size={18}
        color="#0f766e"
      />
    </Pressable>
  )
}


const styles = StyleSheet.create({
  form: { gap: 14 },
  eyeBtn: { padding: 4 },
  serverError: {
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
