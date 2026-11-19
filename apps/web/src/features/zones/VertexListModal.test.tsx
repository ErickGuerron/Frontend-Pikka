import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Coordinate } from '@/features/geo/types'
import { VertexListModal } from './VertexListModal'

const vertices: Coordinate[] = [
  { latitude: -0.2, longitude: -78.5 },
  { latitude: -0.2, longitude: -78.4 },
  { latitude: -0.1, longitude: -78.4 },
]

function renderModal(overrides: Partial<Parameters<typeof VertexListModal>[0]> = {}) {
  const props = {
    title: 'Exterior',
    vertices,
    onRemove: vi.fn<(index: number) => void>(),
    onClose: vi.fn(),
    ...overrides,
  }
  render(<VertexListModal {...props} />)
  return props
}

describe('listado completo de vértices', () => {
  it('se presenta como diálogo modal nombrado por su título en minúsculas', () => {
    renderModal({ title: 'Hueco' })

    const dialog = screen.getByRole('dialog', { name: 'Vértices del hueco' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('enfoca el botón de cerrar al abrirse para que el teclado quede dentro del diálogo', () => {
    renderModal()

    expect(screen.getByRole('button', { name: 'Cerrar listado de vértices' })).toHaveFocus()
  })

  it('muestra cada vértice con su etiqueta V-01 y coordenadas a seis decimales', () => {
    renderModal()

    expect(screen.getByText('V-01')).toBeInTheDocument()
    expect(screen.getByText('V-03')).toBeInTheDocument()
    expect(screen.getAllByText('-0.200000')).toHaveLength(2)
    expect(screen.getAllByText('-78.400000')).toHaveLength(2)
  })

  it('usa el singular cuando hay un solo punto', () => {
    renderModal({ vertices: [vertices[0] ?? { latitude: 0, longitude: 0 }] })

    expect(screen.getByText(/1 punto que define/)).toBeInTheDocument()
  })

  it('usa el plural para varios puntos', () => {
    renderModal()

    expect(screen.getByText(/3 puntos que definen/)).toBeInTheDocument()
  })

  it('quita el vértice indicado por su posición en la lista', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderModal()

    await user.click(screen.getByRole('button', { name: 'Quitar vértice V-02 del listado' }))

    expect(props.onRemove).toHaveBeenCalledExactlyOnceWith(1)
    expect(props.onClose).not.toHaveBeenCalled()
  })

  it('cierra con el botón de la cabecera y con el botón Listo', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderModal()

    await user.click(screen.getByRole('button', { name: 'Cerrar listado de vértices' }))
    await user.click(screen.getByRole('button', { name: 'Listo' }))

    expect(props.onClose).toHaveBeenCalledTimes(2)
  })

  it('un clic en el fondo oscuro cierra el modal', () => {
    const props = renderModal()
    const backdrop = screen.getByRole('dialog').parentElement

    fireEvent.mouseDown(backdrop ?? document.body)

    expect(props.onClose).toHaveBeenCalledOnce()
  })

  it('un clic dentro del diálogo no lo cierra', () => {
    const props = renderModal()

    fireEvent.mouseDown(screen.getByRole('table'))

    expect(props.onClose).not.toHaveBeenCalled()
  })
})
