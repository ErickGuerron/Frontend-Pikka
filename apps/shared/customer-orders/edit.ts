export interface DeliveryDetails {
  address: string
  location: { latitude: number; longitude: number } | null
  deliveryDate: string
  windowStart: string
  windowEnd: string
  addressReference: string
  postalCode: string
  contactPhone: string
}

export type DeliveryEdit = Partial<Omit<DeliveryDetails, 'location'>> & {
  latitude?: number
  longitude?: number
}

export function deliveryChanges(original: DeliveryDetails, draft: DeliveryDetails, canChangeSchedule: boolean): DeliveryEdit | null {
  const changes: DeliveryEdit = {}
  for (const field of ['addressReference', 'postalCode', 'contactPhone'] as const) {
    if (original[field] !== draft[field]) changes[field] = draft[field]
  }
  if (!canChangeSchedule) return changes
  for (const field of ['deliveryDate', 'windowStart', 'windowEnd'] as const) {
    if (original[field] !== draft[field]) changes[field] = draft[field]
  }
  if (original.address !== draft.address || original.location?.latitude !== draft.location?.latitude ||
      original.location?.longitude !== draft.location?.longitude) {
    if (draft.location === null) return null
    Object.assign(changes, { address: draft.address, ...draft.location })
  }
  return changes
}
