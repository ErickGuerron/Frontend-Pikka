import { Ionicons } from '@expo/vector-icons'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

interface Props {
  /** Labels of the fields that failed; the alert is visible while there is at least one. */
  fields: readonly string[]
  onClose: () => void
}

/**
 * SweetAlert-style notice for long forms: when a step is missing, says so and names each field that failed,
 * so the customer does not have to scroll looking for the red message.
 */
export function ValidationAlert({ fields, onClose }: Props) {
  return (
    <Modal transparent animationType="fade" visible={fields.length > 0} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View accessibilityViewIsModal accessibilityRole="alert" style={styles.dialog}>
          <View style={styles.icon}>
            <Ionicons name="alert" size={34} color="#b45309" />
          </View>
          <Text style={styles.title}>Falta un paso</Text>
          <Text style={styles.body}>Completa o corrige {fields.length === 1 ? 'este campo' : 'estos campos'}:</Text>
          <View style={styles.list}>
            {fields.map((field) => (
              <View key={field} style={styles.item}>
                <View style={styles.bullet} />
                <Text style={styles.itemText}>{field}</Text>
              </View>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Entendido"
            onPress={onClose}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Entendido</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(6,31,35,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 24, gap: 10, alignItems: 'center' },
  icon: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: '#facc15', backgroundColor: '#fef9c3', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.onSurface },
  body: { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center' },
  list: { alignSelf: 'stretch', gap: 6, backgroundColor: colors.surfaceContainerLow, borderRadius: 10, padding: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error },
  itemText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.onSurface },
  button: { alignSelf: 'stretch', marginTop: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  buttonText: { color: colors.onPrimary, fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.85 },
})
