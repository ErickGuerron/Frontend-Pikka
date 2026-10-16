import pikkaNutria from '@/assets/pikka.png'

export function Hero() {
  return (
    <section id="inicio" className="border-b border-[var(--landing-line)] bg-[var(--landing-bg)] py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded border border-[var(--landing-line)] bg-white p-6 shadow-sm sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded border border-[var(--landing-line)] bg-[var(--landing-tag-bg)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-[var(--landing-deep)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                <span className="font-semibold">DOSSIER LOGÍSTICO · RED OFICIAL PIKKA</span>
              </div>

              <h1 className="text-3xl font-normal leading-[1.12] tracking-tight text-[var(--landing-deep)] sm:text-4xl lg:text-5xl">
                Lo mejor de la ciudad,
                <br />
                <span className="font-light italic text-[var(--landing-secondary)]">en tu puerta en minutos.</span>
              </h1>

              <p className="max-w-xl text-sm font-normal leading-relaxed text-[var(--landing-text-variant)] sm:text-base">
                Pastelería de alta repostería, detalles curatoriales, tecnología calibrada y dermocosmética activa.
                Despacho directo con monitoreo de telemetría y soporte isotérmico de grado clínico.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2 font-mono text-[11px]">
                <div className="rounded border border-[var(--landing-line)] bg-[var(--landing-bg)] px-2.5 py-1 text-[var(--landing-deep)]">
                  TIEMPO PROMEDIO: <span className="font-bold text-[var(--landing-deep)]">26 MIN</span>
                </div>
                <div className="rounded border border-[var(--landing-line)] bg-[var(--landing-bg)] px-2.5 py-1 text-[var(--landing-deep)]">
                  TEMPERATURA CABINA: <span className="font-bold text-[var(--landing-deep)]">4.0 °C</span>
                </div>
                <div className="rounded border border-[var(--landing-line)] bg-[var(--landing-bg)] px-2.5 py-1 text-[var(--landing-deep)]">
                  CALIFICACIÓN: <span className="font-bold text-[var(--landing-deep)]">★ 4.9 / 5.0</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <a
                  href="#catalogo"
                  className="flex items-center gap-2 rounded-full border border-[var(--landing-deep)] bg-[var(--landing-deep)] px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[var(--landing-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)]"
                >
                  <span>Explorar catálogo disponible</span>
                  <span>→</span>
                </a>
                <a
                  href="#rastreo"
                  className="rounded-full border border-[var(--landing-deep)] bg-transparent px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--landing-deep)] transition-colors hover:bg-[var(--landing-tag-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)]"
                >
                  <span>Ver protocolo técnico</span>
                </a>
              </div>
            </div>

            {/* Nutria Mensajera Oficial Card */}
            <div className="relative flex justify-center lg:col-span-5">
              <div className="relative flex aspect-square w-72 flex-col items-center justify-between rounded border border-[var(--landing-line)] bg-[var(--landing-card)] p-6 shadow-sm sm:w-80 lg:w-96">
                <div className="flex w-full items-center justify-between border-b border-[var(--landing-line)] pb-2 font-mono text-[10px] uppercase tracking-wider text-[var(--landing-muted)]">
                  <span className="font-semibold text-[var(--landing-deep)]">FIG. 01 — MASCOTA OFICIAL</span>
                  <span className="font-bold text-[var(--landing-accent)]">ESTADO: ACTIVO</span>
                </div>

                <div className="my-auto flex w-full items-center justify-center px-2 py-4">
                  <img
                    src={pikkaNutria}
                    alt="Nutria mensajera con regalo y mochila oficial Pikka"
                    className="h-52 w-52 object-contain drop-shadow-md transition-transform duration-500 hover:scale-105 sm:h-60 sm:w-60"
                  />
                </div>

                <div className="grid w-full grid-cols-2 gap-2 border-t border-[var(--landing-line)] pt-2 font-mono text-[10px] text-[var(--landing-text)]">
                  <div className="rounded border border-[var(--landing-line)] bg-white p-1.5">
                    <span className="block text-[9px] text-[var(--landing-muted)]">DESPACHO</span>
                    <span className="font-bold text-[var(--landing-deep)]">LISTO EN 6 MIN</span>
                  </div>
                  <div className="rounded border border-[var(--landing-line)] bg-white p-1.5">
                    <span className="block text-[9px] text-[var(--landing-muted)]">MONITOREO</span>
                    <span className="font-bold text-[var(--landing-deep)]">CADENA DE FRÍO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
