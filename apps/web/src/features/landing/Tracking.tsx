import { Link } from 'react-router'

export function Tracking() {
  return (
    <section
      id="rastreo"
      aria-labelledby="rastreo-titulo"
      className="relative overflow-hidden border-t border-[var(--landing-primary-darker)] bg-[var(--landing-primary-dark)] py-16 text-white"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          {/* Left technical column */}
          <div className="space-y-6 lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded border border-[var(--landing-accent)]/30 bg-[var(--landing-accent)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--landing-accent-light)]">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--landing-accent-light)]" />
              <span>LOGÍSTICA DE PRECISIÓN · PROTOCOLO OFICIAL</span>
            </div>

            <h2 id="rastreo-titulo" className="text-3xl font-normal leading-tight tracking-tight !text-white sm:text-4xl">
              Así llega tu pedido
            </h2>

            <p className="text-sm leading-relaxed text-[var(--landing-fixed-dim)]">
              Cada entrega sigue un riguroso protocolo en tres etapas. Desde tu cuenta personal puedes consultar el
              estado y avance de tus pedidos en tiempo real.
            </p>

            <div className="space-y-3 pt-2 font-mono text-xs">
              <div className="flex items-start gap-3 rounded border border-[var(--landing-accent)]/20 bg-white/5 p-3.5">
                <span className="text-[11px] font-bold text-[var(--landing-accent-light)]">[01]</span>
                <div>
                  <h3 className="font-bold !text-white">Sellado en almacén</h3>
                  <p className="mt-0.5 text-[11px] text-[var(--landing-fixed-dim)]">
                    Tu pedido se prepara y se sella en empaque isotérmico antes de salir.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded border border-[var(--landing-accent)]/20 bg-white/5 p-3.5">
                <span className="text-[11px] font-bold text-[var(--landing-accent-light)]">[02]</span>
                <div>
                  <h3 className="font-bold !text-white">Despacho en flota</h3>
                  <p className="mt-0.5 text-[11px] text-[var(--landing-fixed-dim)]">
                    Sale a ruta con la flota de repartidores dedicados de Pikka.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded border border-[var(--landing-accent)]/20 bg-white/5 p-3.5">
                <span className="text-[11px] font-bold text-[var(--landing-accent-light)]">[03]</span>
                <div>
                  <h3 className="font-bold !text-white">Entrega con código PIN</h3>
                  <p className="mt-0.5 text-[11px] text-[var(--landing-fixed-dim)]">
                    La entrega se valida con un código PIN de confirmación al recibir.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded border border-primary bg-primary px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-white font-semibold transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>Entra a tu cuenta para seguir tu pedido</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Right technical dossier map card */}
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded border border-[var(--landing-accent)]/30 bg-[var(--landing-primary-darker)] shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--landing-accent)]/20 bg-[var(--landing-primary-panel)] p-4 font-mono text-xs sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--landing-accent-light)]" />
                  <div>
                    <span className="font-bold text-white">PROTOCOLO DE ENRUTAMIENTO</span>
                    <span className="block text-[10px] text-[var(--landing-fixed-dim)]">
                      LOGÍSTICA URBANA PROGRAMADA
                    </span>
                  </div>
                </div>
                <div className="text-right text-[10px] text-[var(--landing-fixed-dim)]">
                  <span>SISTEMA PIKKA</span>
                  <span className="block font-bold text-[var(--landing-fixed)]">ORIGEN → DESTINO</span>
                </div>
              </div>

              {/* Blueprint radar grid */}
              <div className="relative flex h-64 w-full items-center justify-center overflow-hidden bg-[var(--landing-primary-radar)] sm:h-72">
                <div className="absolute inset-0 bg-[radial-gradient(var(--landing-accent)_1px,transparent_1px)] opacity-15 [background-size:20px_20px]" />

                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 600 300"
                  fill="none"
                  preserveAspectRatio="xMidYMid slice"
                  aria-hidden="true"
                >
                  <path d="M-20 60 L620 60" stroke="var(--landing-accent)" strokeOpacity="0.1" strokeWidth="1" />
                  <path d="M-20 140 L620 140" stroke="var(--landing-accent)" strokeOpacity="0.1" strokeWidth="1" />
                  <path d="M-20 220 L620 220" stroke="var(--landing-accent)" strokeOpacity="0.1" strokeWidth="1" />
                  <path d="M100 -20 L100 320" stroke="var(--landing-accent)" strokeOpacity="0.1" strokeWidth="1" />
                  <path d="M240 -20 L240 320" stroke="var(--landing-accent)" strokeOpacity="0.1" strokeWidth="1" />
                  <path d="M380 -20 L380 320" stroke="var(--landing-accent)" strokeOpacity="0.1" strokeWidth="1" />
                  <path d="M520 -20 L520 320" stroke="var(--landing-accent)" strokeOpacity="0.1" strokeWidth="1" />

                  {/* Main road lines */}
                  <path
                    d="M0 190 Q160 180 230 145 T390 110 T600 95"
                    stroke="var(--landing-deep)"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 190 Q160 180 230 145 T390 110 T600 95"
                    stroke="var(--landing-primary-hover)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M110 260 L240 145 L320 155 L420 85 L540 80"
                    stroke="var(--landing-primary-hover)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M110 215 L180 215 L240 145 L340 145 L415 105 L480 105"
                    stroke="var(--landing-accent-light)"
                    strokeOpacity="0.2"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M110 215 L180 215 L240 145 L340 145 L415 105 L480 105"
                    stroke="var(--landing-accent-light)"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />

                  {/* Origin waypoint */}
                  <g transform="translate(110, 215)">
                    <circle r="16" fill="var(--landing-accent)" fillOpacity="0.2" />
                    <circle r="7" fill="var(--landing-primary-dark)" stroke="var(--landing-accent-light)" strokeWidth="2.5" />
                    <circle r="3" fill="#ffffff" />
                  </g>

                  {/* Courier waypoint */}
                  <g transform="translate(310, 145)">
                    <circle r="20" fill="var(--landing-accent-light)" fillOpacity="0.25" className="animate-ping" />
                    <circle r="10" fill="var(--landing-deep)" stroke="var(--landing-accent-light)" strokeWidth="2.5" />
                    <polygon points="-4,-4 6,0 -4,4" fill="#ffffff" />
                  </g>

                  {/* Destination waypoint */}
                  <g transform="translate(480, 105)">
                    <circle r="18" fill="var(--landing-accent)" fillOpacity="0.2" />
                    <circle r="8" fill="var(--landing-deep)" stroke="#ffffff" strokeWidth="2.5" />
                    <circle r="3" fill="var(--landing-accent-light)" />
                  </g>

                  {/* Radar compass top right */}
                  <circle cx="530" cy="50" r="32" stroke="var(--landing-accent)" strokeOpacity="0.2" strokeWidth="1" fill="none" />
                  <circle cx="530" cy="50" r="16" stroke="var(--landing-accent)" strokeOpacity="0.2" strokeWidth="1" fill="none" />
                  <line x1="530" y1="14" x2="530" y2="86" stroke="var(--landing-accent)" strokeOpacity="0.2" strokeWidth="1" />
                  <line x1="494" y1="50" x2="566" y2="50" stroke="var(--landing-accent)" strokeOpacity="0.2" strokeWidth="1" />
                </svg>

                {/* Radar HUD pills */}
                <div className="absolute left-3 top-3 space-y-0.5 rounded border border-[var(--landing-accent)]/30 bg-[var(--landing-primary-panel)]/90 px-2.5 py-1.5 font-mono text-[10px] shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent-light)]" />
                    <span className="text-[9px] uppercase tracking-wider text-[var(--landing-fixed-dim)]">ORIGEN:</span>
                    <span className="font-bold text-white">ALMACÉN DE SALIDA</span>
                  </div>
                </div>

                <div className="absolute bottom-3 right-3 space-y-0.5 rounded border border-[var(--landing-accent)]/30 bg-[var(--landing-primary-panel)]/90 px-2.5 py-1.5 text-right font-mono text-[10px] shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-bold text-white">TU DOMICILIO</span>
                    <span className="text-[9px] uppercase tracking-wider text-[var(--landing-fixed-dim)]">:DESTINO</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                  <div className="text-[9px] font-medium text-[var(--landing-accent-light)]">ENTREGA SEGURA</div>
                </div>
              </div>

              {/* Telemetry readouts bottom grid */}
              <div className="grid grid-cols-3 divide-x divide-[var(--landing-accent)]/20 bg-[var(--landing-primary-panel)] p-4 text-center font-mono">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-[var(--landing-fixed-dim)]">
                    ETAPA 1
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-white">SELLADO</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-[var(--landing-fixed-dim)]">
                    ETAPA 2
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-[var(--landing-accent-light)]">DESPACHO</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-[var(--landing-fixed-dim)]">
                    ETAPA 3
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-white">ENTREGA PIN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
