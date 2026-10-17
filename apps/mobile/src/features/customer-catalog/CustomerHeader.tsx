import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface Props {
  onPressProfile?: () => void
}

export function CustomerHeader({ onPressProfile }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        {/* Left: Distinctive Pikka Logo with turquoise dot on 'ı' */}
        <View style={styles.leftGroup}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>p</Text>
            <View style={styles.iWrapper}>
              <View style={styles.iDot} />
              <Text style={styles.logoText}>ı</Text>
            </View>
            <Text style={styles.logoText}>kka</Text>
          </View>
        </View>

        {/* Right: User Avatar */}
        <View style={styles.rightGroup}>
          <Pressable
            style={styles.avatarWrapper}
            onPress={onPressProfile}
            accessibilityRole="button"
            accessibilityLabel="Perfil de usuario"
          >
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida/AEtjO1Way75P0_Ras-8rr8lYhDHSY7NAIVvqE5JumXqisuBjfrkoEZWu-Fk1mBTi_Hc2usuRCsTlKMIfhzFDdHuxMU391nU7byye7dbNMXh4xL2p61F1C597zaVrBsNrMTOd25FrCXnV6GHQInn9sARFtdLnwv9jJi1MCbCET1N47SJx6QqiL9DyPc205QMPAV9G5bXoyfHtPJFPcP7ezPh9jYDOhYPTONpj-HYrmxY2kWq_pwiXs4t5A7kH5ozGh3beHk_ZgsGOa8ZK6g',
              }}
              style={styles.avatarImage}
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: 'rgba(239, 252, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 42, 47, 0.06)',
    zIndex: 50,
  },
  header: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#004b4e',
    letterSpacing: -0.5,
  },
  iWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  iDot: {
    position: 'absolute',
    top: 2,
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    backgroundColor: '#48dcc8',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#a5eff2',
    overflow: 'hidden',
    backgroundColor: '#0a6568',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
})
