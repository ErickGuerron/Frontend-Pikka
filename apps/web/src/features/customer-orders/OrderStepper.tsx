import { progressIndex, progressSteps, type OrderStatus } from './types'

/** Horizontal progress: Confirmado, Preparado, En camino, Entregado. */
export function OrderStepper({ status }: { status: OrderStatus }) {
  const current = progressIndex(status)
  if (current < 0) return null
  const percent = Math.round((current / (progressSteps.length - 1)) * 100)

  return (
    <div className="flex flex-col gap-2">
      <div
        role="progressbar"
        aria-label="Progreso del pedido"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={progressSteps[current]}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-container"
      >
        <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${String(percent)}%` }} />
      </div>
      <ol className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold uppercase tracking-wide sm:text-[11px]">
        {progressSteps.map((label, index) => (
          <li
            key={label}
            aria-current={index === current ? 'step' : undefined}
            className={index <= current ? 'text-secondary' : 'text-on-surface-variant/70'}
          >
            {label}
          </li>
        ))}
      </ol>
    </div>
  )
}
