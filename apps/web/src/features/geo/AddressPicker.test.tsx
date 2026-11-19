import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from '@/features/customer-orders/Modal'
import { AddressPicker } from './AddressPicker'
import type { Place } from './photon'

vi.mock('./api', () => ({
  reverseStreetPlace: vi.fn(() => Promise.resolve(null)),
  searchPlaces: vi.fn(() => Promise.resolve([])),
}))

// El mapa real necesita un navegador (lo cubre el e2e): aquí un nodo expone lo que recibe y un botón emite un punto.
vi.mock('./LazyMapCanvas', async () => {
  const { createElement } = await import('react')
  return {
    LazyMapCanvas: (props: {
      className?: string
      zones?: readonly unknown[]
      picked?: { latitude: number; longitude: number } | null
      onMapClick: (point: { latitude: number; longitude: number }) => void
    }) =>
      createElement(
        'div',
        {
          'data-testid': 'map',
          'data-class': props.className ?? '',
          'data-zones': String(props.zones?.length ?? 0),
          'data-picked': props.picked ? `${String(props.picked.latitude)},${String(props.picked.longitude)}` : '',
        },
        createElement(
          'button',
          { type: 'button', onClick: () => { props.onMapClick({ latitude: -0.2, longitude: -78.5 }) } },
          'Elegir punto',
        ),
      ),
  }
})

const zone = {
  id: 'z-1',
  name: 'Zona Centro',
  ring: [
    { latitude: -0.1, longitude: -78.6 },
    { latitude: -0.1, longitude: -78.4 },
    { latitude: -0.3, longitude: -78.4 },
  ],
  holes: [],
}

function Harness({ expandable = true, inModal = false, onModalClose = () => undefined }: { expandable?: boolean; inModal?: boolean; onModalClose?: () => void }) {
  const [value, setValue] = useState<Place | null>(null)
  const picker = <AddressPicker value={value} onChange={setValue} zones={[zone]} expandable={expandable} />
  return (
    <QueryClientProvider client={new QueryClient()}>
      {inModal ? <Modal title="Hacer nuevo pedido" titleId="modal-title" onClose={onModalClose}>{picker}</Modal> : picker}
    </QueryClientProvider>
  )
}

describe('mapa ampliable del selector de dirección', () => {
  it('sin expandable no ofrece ampliar el mapa (las zonas ya usan un área de trabajo grande)', () => {
    render(<Harness expandable={false} />)

    expect(screen.queryByRole('button', { name: 'Ampliar mapa' })).not.toBeInTheDocument()
  })

  it('con expandable ofrece el botón Ampliar mapa junto al mapa', () => {
    render(<Harness />)

    expect(screen.getByRole('button', { name: 'Ampliar mapa' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('al ampliar abre un diálogo con el mismo mapa, con sus zonas, en grande', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const inline = screen.getByTestId('map')
    expect(inline.dataset.class).toContain('h-[420px]')

    await user.click(screen.getByRole('button', { name: 'Ampliar mapa' }))

    const dialog = await screen.findByRole('dialog', { name: 'Mapa ampliado' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    const big = within(dialog).getByTestId('map')
    expect(big.dataset.class).toContain('h-[70vh]')
    expect(big.dataset.zones).toBe('1')
    expect(within(dialog).getByLabelText('Buscar calle o lugar')).toBeInTheDocument()
  })

  it('elegir un punto en el mapa ampliado actualiza la selección y se conserva al cerrar', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Ampliar mapa' }))
    const dialog = await screen.findByRole('dialog', { name: 'Mapa ampliado' })

    await user.click(within(dialog).getByRole('button', { name: 'Elegir punto' }))

    expect(await within(dialog).findByText('-0.20000, -78.50000')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Listo' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nombre del lugar')).toBeInTheDocument()
    expect(screen.getByTestId('map').dataset.picked).toBe('-0.2,-78.5')
  })

  it('Escape cierra solo el mapa ampliado y no el formulario que lo contiene', async () => {
    const user = userEvent.setup()
    const onModalClose = vi.fn()
    render(<Harness inModal onModalClose={onModalClose} />)
    await user.click(screen.getByRole('button', { name: 'Ampliar mapa' }))
    await screen.findByRole('dialog', { name: 'Mapa ampliado' })

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Mapa ampliado' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Hacer nuevo pedido' })).toBeInTheDocument()
    expect(onModalClose).not.toHaveBeenCalled()

    await user.keyboard('{Escape}')
    expect(onModalClose).toHaveBeenCalledTimes(1)
  })

  it('al cerrar devuelve el foco al botón Ampliar mapa', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Ampliar mapa' })
    await user.click(opener)
    const dialog = await screen.findByRole('dialog', { name: 'Mapa ampliado' })

    await user.click(within(dialog).getByRole('button', { name: 'Listo' }))

    expect(opener).toHaveFocus()
  })

  it('el botón de cerrar de la cabecera también cierra el mapa ampliado', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Ampliar mapa' }))
    const dialog = await screen.findByRole('dialog', { name: 'Mapa ampliado' })

    await user.click(within(dialog).getByRole('button', { name: 'Cerrar mapa ampliado' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
