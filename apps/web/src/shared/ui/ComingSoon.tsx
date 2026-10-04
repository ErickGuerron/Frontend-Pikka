export function ComingSoon({ title, phase, description }: { title: string; phase: number; description: string }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p>{description}</p>
      <p className="muted">Se habilita en la fase {phase} del plan de implementación.</p>
    </section>
  )
}
