import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { NewOrderForm } from '../../../features/customer-orders/NewOrderForm'

export default function NewOrderScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>()
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <NewOrderForm
          initialProductId={productId}
          onCreated={() => {
            if (router.canGoBack()) router.back()
            else router.replace('/mis-pedidos')
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
