import { Link } from 'react-router'
import cafeGalletasImg from '@/assets/landing/cafe-galletas.jpg'
import pastelImg from '@/assets/landing/pastel-chocolate.jpg'
import cajaImg from '@/assets/landing/caja-sorpresa.jpg'

interface QuickFavoritesProps {
  onNewOrder: () => void
}

const FAVORITES = [
  {
    title: 'Café de Especialidad & Galletas',
    category: 'DESAYUNO & MERIENDA',
    price: '$380 MXN',
    badge: 'Entrega ~20 min',
    desc: '2 Cold Brews 350ml + 4 galletas artesanales recién horneadas.',
    img: cafeGalletasImg,
  },
  {
    title: 'Pastel Belga Frutos Rojos',
    category: 'REPOSTERÍA BOUTIQUE',
    price: '$420 MXN',
    badge: 'Cadena Frío',
    desc: 'Bizcocho húmedo, ganache al 70% y bayas frescas silvestres.',
    img: pastelImg,
  },
  {
    title: 'Set Degustación Gourmet',
    category: 'EXPERIENCIA GOURMET',
    price: '$510 MXN',
    badge: 'Favorito Pikka',
    desc: '3 quesos madurados, frutos secos, miel orgánica y crackers.',
    img: cajaImg,
  },
]

export function QuickFavoritesSection({ onNewOrder }: QuickFavoritesProps) {
  return (
    <section aria-labelledby="favoritos-titulo" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 id="favoritos-titulo" className="text-xl sm:text-2xl font-bold tracking-tight text-[#004b4e] font-sans">
            Tus Favoritos Recurrentes
          </h3>
          <p className="font-mono text-xs text-[#557b7f]">
            Pide tus esenciales en segundos con empaque refrigerado precargado.
          </p>
        </div>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-1 font-mono text-xs font-semibold uppercase tracking-wider text-[#004b4e] hover:text-[#0a6568] transition-colors"
        >
          <span>Explorar catálogo completo</span>
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FAVORITES.map((fav) => (
          <div
            key={fav.title}
            className="flex flex-col justify-between rounded-2xl border border-[#cce7ea] bg-white p-4 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="space-y-3">
              <div className="relative h-44 w-full overflow-hidden rounded-xl bg-[#f0fafb]">
                <img
                  src={fav.img}
                  alt={fav.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute top-2.5 right-2.5 rounded-full bg-white/95 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#004b4e] shadow-xs backdrop-blur-sm">
                  {fav.badge}
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] font-semibold text-[#006b5f]">{fav.category}</span>
                  <span className="font-mono text-xs font-bold text-[#004b4e]">{fav.price}</span>
                </div>
                <h4 className="mt-1 font-sans text-sm font-bold text-[#061f23]">{fav.title}</h4>
                <p className="mt-0.5 line-clamp-2 text-xs text-[#557b7f]">{fav.desc}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onNewOrder}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#e8f7f9] hover:bg-[#004b4e] text-[#004b4e] hover:text-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_shopping_cart</span>
              <span>+ Pedir de nuevo</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export function GuaranteeBanner() {
  return (
    <section
      aria-label="Garantía y soporte"
      className="relative overflow-hidden rounded-2xl border border-[#004b4e] bg-[#004b4e] p-5 sm:p-7 text-white shadow-md"
    >
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-[#14b8a6]/20 blur-2xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0a6568] text-[#2dd4bf] border border-[#14b8a6]/30 shadow-inner">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">verified_user</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#2dd4bf]">
                GARANTÍA TOTAL PIKKA
              </span>
              <span className="h-1 w-1 rounded-full bg-[#2dd4bf]" />
              <span className="font-mono text-[10px] text-[#a5eff2]">COLD-CHAIN VERIFIED</span>
            </div>
            <h4 className="font-sans text-base sm:text-lg font-bold text-white">
              ¿Tienes algún requerimiento especial o duda con tu ruta?
            </h4>
            <p className="text-xs sm:text-sm text-[#cce7ea] leading-relaxed">
              Tu paquete viaja monitoreado con sensores isotérmicos en tiempo real. Si la temperatura o el tiempo varía, nuestro equipo interviene automáticamente.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 font-sans text-xs sm:text-sm font-bold text-[#004b4e] shadow-sm hover:bg-[#e8f7f9] transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] text-[#006b5f]" aria-hidden="true">support_agent</span>
            <span>Chat de Soporte Humano</span>
          </button>
          <button
            type="button"
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#14b8a6]/40 bg-[#0a6568]/60 hover:bg-[#0a6568] px-4 py-2.5 font-sans text-xs sm:text-sm font-semibold text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">receipt_long</span>
            <span>Centro de Facturación</span>
          </button>
        </div>
      </div>
    </section>
  )
}
