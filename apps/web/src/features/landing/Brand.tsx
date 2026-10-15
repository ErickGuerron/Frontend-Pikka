/** Marca Pikka en texto: minúsculas, punto de acento teal y barra. Decorativa dentro de un enlace con nombre. */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex select-none flex-col gap-1 font-bold tracking-tight text-primary ${className}`}>
      <span className="flex items-center gap-1 text-2xl leading-none">
        pikka
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--landing-accent)]" />
      </span>
      <span aria-hidden="true" className="h-1 w-8 rounded-full bg-[var(--landing-accent)]" />
    </span>
  )
}
