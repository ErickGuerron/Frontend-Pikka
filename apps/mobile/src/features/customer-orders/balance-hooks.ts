import { useCallback, useEffect, useRef, useState } from 'react'
import { isDemoMode } from '../../api/config'
import { getMyBalance, payMyBalance } from './api'
import type { MyBalance } from './balance'
import { outcomeOfError, outcomeOfPayment, type Outcome } from './payment-outcome'

/**
 * The customer's balance. If the service does not answer (not deployed yet, 5xx, a response that breaks the
 * contract) it stays `null` and the card simply does not appear. Demo mode has no balance.
 */
export function useMyBalance(): { balance: MyBalance | null; reload: () => void } {
  const [balance, setBalance] = useState<MyBalance | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (isDemoMode()) return undefined
    const controller = new AbortController()
    getMyBalance(controller.signal)
      .then((value) => { if (!controller.signal.aborted) setBalance(value) })
      .catch(() => { if (!controller.signal.aborted) setBalance(null) })
    return () => { controller.abort() }
  }, [attempt])

  const reload = useCallback(() => { setAttempt((n) => n + 1) }, [])
  return { balance, reload }
}

export interface PayBalanceState {
  pay: () => Promise<void>
  paying: boolean
  outcome: Outcome | null
  dismiss: () => void
}

/**
 * Pays the whole balance with the simulated card. Approved, declined or failed, the balance and the account
 * may have changed, so `onSettled` always runs. A second press while paying is ignored.
 */
export function usePayBalance(onSettled: () => void): PayBalanceState {
  const [paying, setPaying] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const inFlight = useRef(false)

  const pay = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setPaying(true)
    setOutcome(null)
    try {
      setOutcome(outcomeOfPayment(await payMyBalance()))
    } catch (error: unknown) {
      setOutcome(outcomeOfError(error))
    } finally {
      inFlight.current = false
      setPaying(false)
      onSettled()
    }
  }, [onSettled])

  const dismiss = useCallback(() => { setOutcome(null) }, [])
  return { pay, paying, outcome, dismiss }
}
