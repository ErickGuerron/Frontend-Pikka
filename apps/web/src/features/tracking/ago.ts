/** Qué tan vieja es una posición, en palabras: "hace 12 s", "hace 3 min", "hace 2 h". */
export function agoLabel(recordedAt: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(recordedAt).getTime()) / 1000))
  if (Number.isNaN(seconds)) return 'sin hora'
  if (seconds < 60) return `hace ${String(seconds)} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${String(minutes)} min`
  return `hace ${String(Math.floor(minutes / 60))} h`
}
