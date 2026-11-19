import { useCallback, useEffect, useState } from 'react'
import { isDemoMode } from '../../api/config'
import { listMyNotifications } from './api'
import type { CustomerNotification } from './notifications'

/**
 * The customer's notices. If the service does not answer (not deployed yet, 5xx, a response that breaks the
 * contract) the list stays empty and the panel simply does not appear. Demo mode has no notices.
 */
export function useMyNotifications(): { notifications: CustomerNotification[]; reload: () => void } {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (isDemoMode()) return undefined
    const controller = new AbortController()
    listMyNotifications(controller.signal)
      .then((list) => { if (!controller.signal.aborted) setNotifications(list) })
      .catch(() => { if (!controller.signal.aborted) setNotifications([]) })
    return () => { controller.abort() }
  }, [attempt])

  const reload = useCallback(() => { setAttempt((n) => n + 1) }, [])
  return { notifications, reload }
}
