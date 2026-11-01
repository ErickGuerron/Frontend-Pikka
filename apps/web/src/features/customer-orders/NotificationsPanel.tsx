import { useMyNotifications } from './hooks'
import { notificationDetail, notificationTitle } from './notifications'

/** Avisos del cliente sobre la revisión de sus pedidos. Si no hay avisos, no ocupa espacio. */
export function NotificationsPanel() {
  const notifications = useMyNotifications()
  const list = notifications.data ?? []
  if (list.length === 0) return null

  return (
    <section aria-label="Avisos de tus pedidos" className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-on-surface">Avisos</h2>
      <ul className="flex flex-col gap-2">
        {list.map((n) => (
          <li key={n.id} className="rounded-lg border border-surface-container-high/60 bg-surface-container-lowest px-4 py-3 text-sm">
            <p className="font-semibold text-on-surface">{notificationTitle(n.kind)}</p>
            {notificationDetail(n) !== '' ? <p className="text-xs text-on-surface-variant">{notificationDetail(n)}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
