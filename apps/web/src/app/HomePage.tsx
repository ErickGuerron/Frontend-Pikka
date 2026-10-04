import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks'
import { fetchReadiness } from '@/shared/api/system'

export function HomePage() {
  const { data: user } = useCurrentUser()
  const readiness = useQuery({
    queryKey: ['system', 'ready'],
    queryFn: ({ signal }) => fetchReadiness(signal),
    refetchInterval: 30_000,
    retry: false,
  })

  return (
    <>
      <section className="card">
        <h2>Hola{user ? `, ${user.fullName}` : ''}</h2>
        <p className="muted">Desde aquí vas a registrar pedidos, administrar zonas, armar rutas y seguir las entregas.</p>
      </section>
      <section className="card">
        <h3>Estado del sistema</h3>
        <p data-testid="system-status">
          {readiness.isPending && 'Comprobando…'}
          {readiness.isSuccess && <span className="success">Backend disponible</span>}
          {readiness.isError && <span className="alert">Backend no disponible</span>}
        </p>
      </section>
    </>
  )
}
