import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <section className="bg-white rounded-xl border border-[#cce7ea] p-8 shadow-sm text-center max-w-md w-full space-y-3">
        <div className="inline-flex items-center gap-2 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
          <span className="font-semibold">ERROR 404 · RUTA NO ENCONTRADA</span>
        </div>
        <h2 className="text-xl font-bold text-[#004b4e] font-sans">Página no encontrada</h2>
        <p className="text-xs font-mono text-[#557b7f]">
          La sección que intentas consultar no existe o fue reubicada en la plataforma.
        </p>
        <div className="pt-3">
          <Link
            to="/"
            className="inline-block px-4 py-2 rounded-lg bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs font-bold uppercase tracking-wider border border-[#004b4e] transition-colors shadow-sm"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </div>
  )
}
