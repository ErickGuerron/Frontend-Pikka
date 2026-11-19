import type { StyleProp, ViewStyle } from 'react-native'
import type { MapState } from './document'
import type { Coordinate } from './geo'

export interface LeafletMapProps {
  state: MapState
  /** Clic o toque sobre el mapa. */
  onPick: (point: Coordinate) => void
  style?: StyleProp<ViewStyle>
}
