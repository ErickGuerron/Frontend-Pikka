import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { NewOrderForm } from '../../../features/customer-orders/NewOrderForm'

export default function NewOrderScreen() {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <NewOrderForm
          onCreated={() => {
            if (router.canGoBack()) router.back()
            else router.replace('/mis-pedidos')
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
