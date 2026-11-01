import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ZoneBrowser } from './ZoneBrowser'
import { buildZone } from './zones.fixtures'
import type { Zone } from './types'

function zone(id: string, name: string, code: string, status: Zone['status'] = 'ACTIVE'): Zone {
  return buildZone({ id, code, name, status, ring: [] })
}

const centro = zone('z-1', 'Centro Histórico', 'CENTRO-001', 'INACTIVE')
const norte = zone('z-2', 'Norte Comercial', 'NORTE-001')
const sur = zone('z-3', 'Sur Residencial', 'SUR-001')

function renderBrowser(props: { zones?: Zone[]; selectedId?: string | null; onPick?: (zone: Zone) => void } = {}) {
  const onPick = props.onPick ?? vi.fn()
  render(<ZoneBrowser zones={props.zones ?? [centro, norte, sur]} selectedId={props.selectedId ?? null} onPick={onPick} />)
  return { onPick }
}

describe('buscador de zonas', () => {
  it('muestra el conteo total de zonas registradas', () => {
    renderBrowser()

    expect(screen.getByRole('region', { name: 'Zonas de reparto' })).toHaveTextContent('3 registradas')
  })

  it('pone las zonas activas antes que las inactivas, conservando el orden del resto', () => {
    renderBrowser()

    const items = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(items[0]).toContain('Norte Comercial')
    expect(items[1]).toContain('Sur Residencial')
    expect(items[2]).toContain('Centro Histórico')
  })

  it('marca cada zona como activa o inactiva con su etiqueta', () => {
    renderBrowser()

    expect(within(screen.getByRole('button', { name: /Centro Histórico/ })).getByText('Inactiva')).toBeInTheDocument()
    expect(within(screen.getByRole('button', { name: /Norte Comercial/ })).getByText('Activa')).toBeInTheDocument()
  })

  it('filtra por nombre sin importar mayúsculas ni espacios alrededor', async () => {
    const user = userEvent.setup({ delay: null })
    renderBrowser()

    await user.type(screen.getByLabelText('Buscar zona por nombre o código'), '  norte ')

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Norte Comercial')).toBeInTheDocument()
  })

  it('filtra también por código de zona', async () => {
    const user = userEvent.setup({ delay: null })
    renderBrowser()

    await user.type(screen.getByLabelText('Buscar zona por nombre o código'), 'sur-001')

    expect(screen.getByText('Sur Residencial')).toBeInTheDocument()
    expect(screen.queryByText('Norte Comercial')).not.toBeInTheDocument()
  })

  it('avisa cuando ninguna zona coincide con la búsqueda', async () => {
    const user = userEvent.setup({ delay: null })
    renderBrowser()

    await user.type(screen.getByLabelText('Buscar zona por nombre o código'), 'xyz')

    expect(screen.getByText('Ninguna zona coincide.')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('explica que aún no hay zonas cuando el listado llega vacío', () => {
    renderBrowser({ zones: [] })

    expect(screen.getByText('Aún no hay zonas registradas.')).toBeInTheDocument()
    expect(screen.queryByText('Ninguna zona coincide.')).not.toBeInTheDocument()
  })

  it('elegir una zona entrega la zona completa a onPick', async () => {
    const user = userEvent.setup({ delay: null })
    const { onPick } = renderBrowser()

    await user.click(screen.getByRole('button', { name: /Sur Residencial/ }))

    expect(onPick).toHaveBeenCalledExactlyOnceWith(sur)
  })

  it('marca como seleccionada solo la zona resaltada en el mapa', () => {
    renderBrowser({ selectedId: 'z-2' })

    expect(screen.getByRole('button', { name: /Norte Comercial/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Sur Residencial/ })).toHaveAttribute('aria-pressed', 'false')
  })
})
