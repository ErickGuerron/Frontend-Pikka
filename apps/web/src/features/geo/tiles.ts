/** Fuente de teselas del mapa: url y atribucion. */
export interface MapTileSource {
  url: string
  attribution: string
}

const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

/**
 * Sin clave, OpenStreetMap (solo desarrollo: su politica de uso bloquea el trafico de produccion). Con clave de
 * MapTiler, sus teselas; la atribucion de OpenStreetMap se mantiene porque sus datos siguen siendo la base.
 */
export function mapTileSource(key: string | undefined): MapTileSource {
  const trimmed = key?.trim() ?? ''
  if (!trimmed) return { url: OSM_URL, attribution: OSM_ATTRIBUTION }
  return {
    url: `https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key=${encodeURIComponent(trimmed)}`,
    attribution: `&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> ${OSM_ATTRIBUTION}`,
  }
}

/** Fuente activa: la clave llega en build (VITE_MAP_TILE_KEY). */
export const MAP_TILE_SOURCE = mapTileSource(import.meta.env.VITE_MAP_TILE_KEY as string | undefined)
