import { Droplet } from 'lucide-react'

/** Pikka wordmark with the droplet icon. */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex select-none items-center gap-2 text-2xl font-bold tracking-tight ${className}`}>
      <Droplet aria-hidden="true" className="h-6 w-6 fill-secondary-fixed text-secondary" />
      <span aria-label="pikka">
        <span className="text-primary">p</span>
        <span className="text-secondary">i</span>
        <span className="text-primary">kka</span>
      </span>
    </span>
  )
}
