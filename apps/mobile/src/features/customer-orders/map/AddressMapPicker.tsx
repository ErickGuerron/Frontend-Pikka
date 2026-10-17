import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../../components/Button'
import { colors } from '../../../theme/colors'
import { useCoverageZones, type CoverageState } from './coverage'
import type { MapState } from './document'
import { zoneCovering, type Coordinate, type CoverageZone } from './geo'
import { LeafletMap } from './LeafletMap'
import { reversePlace } from './photon'

interface Props {
  /** Punto elegido (coordenadas reales), o null. El formulario es el dueño del valor. */
  location: Coordinate | null
  /** Mensaje cuando falta el punto: es obligatorio para hacer el pedido. */
  error?: string | undefined
  /** Dirección escrita en el formulario: solo se rellena sola si está vacía o es la que puso el mapa. */
  address: string
  onChangeLocation: (location: Coordinate | null) => void
  onChangeAddress: (address: string) => void
}

/**
 * Elección del punto de entrega en el mismo mapa que la web (Leaflet con teselas de OpenStreetMap y las zonas de
 * cobertura reales). El punto es una latitud y una longitud de verdad, la dirección llega de Photon y el mapa se
 * puede ampliar a pantalla completa con "Ampliar mapa".
 */
export function AddressMapPicker({ location, error, address, onChangeLocation, onChangeAddress }: Props) {
  const coverage = useCoverageZones()
  const [expanded, setExpanded] = useState(false)
  const [openFocus, setOpenFocus] = useState<Coordinate | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const lookup = useRef<AbortController | null>(null)
  const autoFilled = useRef('')
  const currentAddress = useRef(address)
  currentAddress.current = address

  // Una búsqueda de dirección pendiente no debe llegar después de salir de la pantalla.
  useEffect(() => () => { lookup.current?.abort() }, [])

  const zone = location === null || coverage.zones === null ? null : zoneCovering(location, coverage.zones)
  const zones = coverage.zones
  const zoneId = zone?.id ?? null

  const inlineState = useMemo<MapState>(
    () => ({ zones: zones ?? [], picked: location, focus: null, highlightId: zoneId }),
    [zones, location, zoneId],
  )
  const expandedState = useMemo<MapState>(
    () => ({ zones: zones ?? [], picked: location, focus: openFocus, highlightId: zoneId }),
    [zones, location, openFocus, zoneId],
  )

  const pick = (point: Coordinate) => {
    lookup.current?.abort()
    const controller = new AbortController()
    lookup.current = controller
    onChangeLocation(point)
    setLookingUp(true)
    reversePlace(point.latitude, point.longitude, controller.signal)
      .then((found) => {
        if (controller.signal.aborted) return
        setLookingUp(false)
        if (found === null) return
        const suggestion = found.address || found.name
        // Conserva lo que el cliente escribió a mano: solo reemplaza una dirección vacía o puesta por el mapa.
        if (currentAddress.current === '' || currentAddress.current === autoFilled.current) {
          autoFilled.current = suggestion
          onChangeAddress(suggestion)
        }
      })
      .catch(() => { if (!controller.signal.aborted) setLookingUp(false) })
  }

  const clear = () => {
    lookup.current?.abort()
    setLookingUp(false)
    onChangeLocation(null)
  }

  const open = () => {
    setOpenFocus(location)
    setExpanded(true)
  }
  const close = () => { setExpanded(false) }

  const details = (
    <>
      <CoverageNotice coverage={coverage} located={location !== null} zone={zone} />
      {location === null ? null : (
        <View style={styles.selection}>
          <View style={styles.selectionText}>
            <Text style={styles.coords}>{`${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}</Text>
            {lookingUp ? <Text style={styles.hint}>Buscando dirección…</Text> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Quitar punto" onPress={clear} style={styles.remove}>
            <Text style={styles.removeText}>Quitar punto</Text>
          </Pressable>
        </View>
      )}
    </>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="map-outline" size={16} color={colors.primary} />
        <Text style={styles.title}>Punto en el mapa</Text>
      </View>
      <Text style={styles.hint}>
        Las zonas en verde son las que cubrimos: si tu punto cae dentro, tu pedido no será rechazado por la zona.
      </Text>

      <View style={styles.mapBox}>
        <LeafletMap state={inlineState} onPick={pick} style={styles.map} />
        <Pressable accessibilityRole="button" accessibilityLabel="Ampliar mapa" onPress={open} style={styles.expand}>
          <Ionicons name="expand-outline" size={16} color={colors.primary} />
          <Text style={styles.expandText}>Ampliar mapa</Text>
        </Pressable>
      </View>

      {error !== undefined && location === null ? (
        <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
      ) : null}

      {details}

      <Modal visible={expanded} animationType="slide" onRequestClose={close}>
        <View testID="expanded-map" style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>Mapa ampliado</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar mapa ampliado" onPress={close} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.onSurface} />
            </Pressable>
          </View>
          <LeafletMap state={expandedState} onPick={pick} style={styles.bigMap} />
          <ScrollView style={styles.modalFooter} contentContainerStyle={styles.modalFooterContent}>
            {details}
            <Button label="Listo" onPress={close} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

interface NoticeProps {
  coverage: CoverageState
  located: boolean
  zone: CoverageZone | null
}

/** Dice si el punto elegido está dentro de la cobertura, para que el cliente sepa cómo seguirá su pedido. */
function CoverageNotice({ coverage, located, zone }: NoticeProps) {
  if (coverage.loading) return <Text style={styles.hint}>Cargando zonas de cobertura…</Text>
  if (coverage.failed || coverage.zones === null || coverage.zones.length === 0) {
    return <Text style={styles.hint}>No pudimos mostrar las zonas de cobertura. Un operador validará tu dirección.</Text>
  }
  if (!located) return <Text style={styles.hint}>Marca tu punto en el mapa para saber si está dentro de la cobertura.</Text>
  if (zone !== null) {
    return (
      <Text accessibilityLiveRegion="polite" style={[styles.notice, styles.noticeOk]}>
        {`Dentro de la zona «${zone.name}»: tu pedido no será rechazado por la zona.`}
      </Text>
    )
  }
  return (
    <Text accessibilityLiveRegion="polite" style={[styles.notice, styles.noticeWarn]}>
      Fuera de la cobertura: tu pedido quedará en revisión y un operador podría rechazarlo por la zona. Mueve el punto a una zona verde.
    </Text>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  error: { fontSize: 12, color: colors.error },
  hint: { fontSize: 12, color: colors.onSurfaceVariant },
  mapBox: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.outlineVariant },
  map: { height: 240 },
  expand: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  expandText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  notice: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, fontWeight: '600' },
  noticeOk: { backgroundColor: '#ecfdf5', color: '#065f46' },
  noticeWarn: { backgroundColor: '#fffbeb', color: '#78350f' },
  selection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  selectionText: { flex: 1, gap: 2 },
  coords: { fontSize: 12, fontWeight: '600', color: colors.onSurface },
  remove: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  removeText: { fontSize: 12, fontWeight: '700', color: colors.error },
  modal: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  closeButton: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  bigMap: { flex: 1 },
  modalFooter: { maxHeight: 220, flexGrow: 0 },
  modalFooterContent: { gap: 8, padding: 16 },
})
