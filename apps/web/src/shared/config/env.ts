// Vacío significa mismo origen: en desarrollo Vite reenvía /api al Gateway.
export const apiBaseUrl: string = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
