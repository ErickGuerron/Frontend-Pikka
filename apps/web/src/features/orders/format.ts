/** Fecha YYYY-MM-DD mostrada en formato legible en español. */
export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('es', { weekday: 'short', day: '2-digit', month: 'short' })
}

/** Ventana de entrega como "09:00–11:00". */
export function formatWindow(start: string, end: string): string {
  return `${start}–${end}`
}
