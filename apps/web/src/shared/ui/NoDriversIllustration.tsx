import scooterUrl from './illustrations/no-drivers.svg?url'

/** Ilustración vectorial del scooter de reparto para estados vacíos de repartidores. Decorativa: el texto lo explica. */
export function NoDriversIllustration({ className = '' }: { className?: string }) {
  return <img alt="" aria-hidden="true" className={className} height={76} src={scooterUrl} width={96} />
}
