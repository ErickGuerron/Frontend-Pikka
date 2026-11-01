import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

export interface KeyValueStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

/** expo-secure-store has no web implementation: fall back to localStorage there. Never throws. */
export const secureStorage: KeyValueStorage = {
  async get(key) {
    try {
      if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  async set(key, value) {
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value)
      else await SecureStore.setItemAsync(key, value)
    } catch {
      // Persistence is best effort: the in-memory session still works.
    }
  },
  async remove(key) {
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.removeItem(key)
      else await SecureStore.deleteItemAsync(key)
    } catch {
      // ignore
    }
  },
}
