export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--landing-line)] bg-[var(--landing-bg)] font-mono text-xs text-[var(--landing-muted)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-8 border-b border-[var(--landing-line)] pb-12 sm:gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand info */}
          <div className="space-y-4 font-sans lg:col-span-2">
            <div className="inline-flex items-baseline text-2xl font-bold tracking-tight text-[var(--landing-deep)]" aria-label="pikka">
              <span>p</span>
              <span className="relative inline-block">
                <span className="text-[var(--landing-deep)]">ı</span>
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-[0.14em] h-[0.22em] w-[0.22em] -translate-x-1/2 rounded-full bg-[var(--landing-accent)]"
                />
              </span>
              <span>kka</span>
            </div>
            <p className="max-w-sm text-xs font-normal leading-relaxed text-[var(--landing-muted)]">
              Plataforma oficial de comercio rápido y logística de precisión. Selección curada y entrega garantizada
              de artículos gourmet, pastelería y piezas tecnológicas en minutos.
            </p>
            <div className="flex items-center gap-2.5 pt-2 font-mono text-xs">
              <button
                type="button"
                className="rounded border border-[var(--landing-deep)] bg-[var(--landing-deep)] px-3 py-1.5 text-white transition-colors hover:bg-[var(--landing-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)]"
              >
                App Store
              </button>
              <button
                type="button"
                className="rounded border border-[var(--landing-deep)] bg-[var(--landing-deep)] px-3 py-1.5 text-white transition-colors hover:bg-[var(--landing-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)]"
              >
                Google Play
              </button>
            </div>
          </div>

          {/* Categorías */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--landing-deep)]">
              Categorías
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#catalogo" className="transition-colors hover:text-[var(--landing-deep)]">
                  Pastelería de Autor
                </a>
              </li>
              <li>
                <a href="#catalogo" className="transition-colors hover:text-[var(--landing-deep)]">
                  Cajas Sorpresa &amp; Regalos
                </a>
              </li>
              <li>
                <a href="#catalogo" className="transition-colors hover:text-[var(--landing-deep)]">
                  Floristería Fina
                </a>
              </li>
              <li>
                <a href="#catalogo" className="transition-colors hover:text-[var(--landing-deep)]">
                  Audio &amp; Tecnología
                </a>
              </li>
              <li>
                <a href="#catalogo" className="transition-colors hover:text-[var(--landing-deep)]">
                  Dermocosmética
                </a>
              </li>
            </ul>
          </div>

          {/* Atención al Cliente */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--landing-deep)]">
              Atención al Cliente
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#rastreo" className="transition-colors hover:text-[var(--landing-deep)]">
                  Rastrear mi pedido
                </a>
              </li>
              <li>
                <a href="#inicio" className="transition-colors hover:text-[var(--landing-deep)]">
                  Centro de Ayuda
                </a>
              </li>
              <li>
                <a href="#inicio" className="transition-colors hover:text-[var(--landing-deep)]">
                  Políticas de Devolución
                </a>
              </li>
              <li>
                <a href="#inicio" className="transition-colors hover:text-[var(--landing-deep)]">
                  Facturación Electrónica
                </a>
              </li>
              <li>
                <a href="#inicio" className="transition-colors hover:text-[var(--landing-deep)]">
                  Preguntas Frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Seguridad & Red */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--landing-deep)]">
              Seguridad &amp; Red
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#inicio" className="transition-colors hover:text-[var(--landing-deep)]">
                  Aviso de Privacidad
                </a>
              </li>
              <li>
                <a href="#inicio" className="transition-colors hover:text-[var(--landing-deep)]">
                  Términos de Servicio
                </a>
              </li>
              <li>
                <a href="#inicio" className="transition-colors hover:text-[var(--landing-deep)]">
                  Protocolo de Cadena de Frío
                </a>
              </li>
              <li>
                <a href="#inicio" className="transition-colors hover:text-[var(--landing-deep)]">
                  Únete a la Flota Pikka
                </a>
              </li>
            </ul>
            <div className="pt-2">
              <span className="inline-block rounded border border-[var(--landing-line)] bg-white px-2 py-1 font-mono text-[10px] font-semibold text-[var(--landing-deep)]">
                PAGOS CIFRADOS TLS 256-BIT
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-[11px] text-[var(--landing-muted)] sm:flex-row">
          <p>© {currentYear} Pikka Inc. Todos los derechos reservados · Sistema de Entrega de Precisión.</p>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
            <span className="font-semibold text-[var(--landing-deep)]">OPERACIÓN ACTIVA EN CDMX Y SANTIAGO</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
