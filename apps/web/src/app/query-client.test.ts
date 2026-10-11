import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { clearCacheOnSignOut } from './query-client'

beforeEach(() => {
  useSession.getState().clear()
})

describe('clearCacheOnSignOut', () => {
  it('descarta la caché cuando la sesión se cierra por 401 (token a null)', () => {
    const client = new QueryClient()
    const stop = clearCacheOnSignOut(client)
    useSession.getState().setToken('tok-admin')
    client.setQueryData(['orders'], [{ id: 'o-1' }])

    useSession.getState().clear()

    expect(client.getQueryData(['orders'])).toBeUndefined()
    stop()
  })

  it('no descarta la caché al iniciar sesión', () => {
    const client = new QueryClient()
    const stop = clearCacheOnSignOut(client)
    client.setQueryData(['auth', 'me'], { id: 'u-1' })

    useSession.getState().setToken('tok-nuevo')

    expect(client.getQueryData(['auth', 'me'])).toEqual({ id: 'u-1' })
    stop()
  })

  it('deja de escuchar tras ejecutar la función devuelta', () => {
    const client = new QueryClient()
    const stop = clearCacheOnSignOut(client)
    stop()
    useSession.getState().setToken('tok')
    client.setQueryData(['orders'], [])

    useSession.getState().clear()

    expect(client.getQueryData(['orders'])).toEqual([])
  })
})
