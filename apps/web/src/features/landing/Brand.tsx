import logoIsotipo from '@/assets/landing/logo-isotipo.png'

interface BrandProps {
  className?: string
  variant?: 'deep' | 'white'
  showIsotipo?: boolean
  textSize?: string
}

/** Logotipo oficial Pikka con isotipo e isotipo tipográfico con todas las letras a la misma altura. */
export function Brand({
  className = '',
  variant = 'deep',
  showIsotipo = true,
  textSize = 'text-2xl',
}: BrandProps) {
  const isWhite = variant === 'white'
  const textColor = isWhite ? 'text-white' : 'text-[var(--landing-deep)]'
  const dotColor = isWhite ? 'bg-[#2dd4bf]' : 'bg-[var(--landing-accent)]'
  const boxBg = isWhite
    ? 'border-[#14b8a6]/30 bg-[#001d1f]'
    : 'border-[var(--landing-deep)] bg-[var(--landing-deep)]'

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showIsotipo && (
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border ${boxBg} p-1 shadow-sm`}>
          <img
            alt="Pikka Nutria Isotipo"
            src={logoIsotipo}
            className="h-full w-full object-contain brightness-0 invert"
          />
        </div>
      )}
      <span
        aria-label="pikka"
        className={`inline-flex items-baseline font-sans font-bold tracking-tight select-none ${textSize} ${textColor}`}
      >
        <span>p</span>
        <span className="relative inline-block">
          <span className={textColor}>ı</span>
          <span
            aria-hidden="true"
            className={`absolute left-1/2 top-[0.14em] h-[0.22em] w-[0.22em] -translate-x-1/2 rounded-full ${dotColor}`}
          />
        </span>
        <span>kka</span>
      </span>
    </div>
  )
}
