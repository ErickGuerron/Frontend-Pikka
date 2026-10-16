/** Fondos para productos sin imagen; el color depende del id para que no cambie entre cargas. */
const PLACEHOLDER_COLORS = ['#a5eff2', '#d7f0d0', '#ffe3c2', '#e6d9f5', '#ffd6d6', '#d3e4fd']

export function placeholderColor(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length] ?? '#a5eff2'
}
