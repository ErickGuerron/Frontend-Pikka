import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useSessionStore } from '../store/session-store'
import { colors } from '../theme/colors'

/** Reads the persisted session before any route renders, so there is no login flash. */
export default function RootLayout() {
  const hydrated = useSessionStore((s) => s.hydrated)
  const hydrate = useSessionStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    <>
      <StatusBar style="dark" />
      {hydrated ? (
        <Slot />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </>
  )
}
