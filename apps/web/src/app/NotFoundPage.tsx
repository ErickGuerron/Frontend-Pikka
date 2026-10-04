import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="card">
      <h2>Página no encontrada</h2>
      <Link to="/">Volver al inicio</Link>
    </section>
  )
}
