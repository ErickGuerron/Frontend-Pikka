/** First letter of a name for avatar circles. */
export function initialOf(name: string | undefined): string {
  return name?.trim().charAt(0).toUpperCase() || '?'
}
