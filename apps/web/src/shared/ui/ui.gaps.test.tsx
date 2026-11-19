import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ComingSoon } from './ComingSoon'
import { useDialog } from './dialog'
import { Pagination, PAGE_SIZE, usePagination } from './pagination'

function DialogHarness({ locked = false, onClose }: { locked?: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLButtonElement>(null)
  useDialog(dialogRef, firstRef, onClose, locked)
  return (
    <>
      <button type="button">Fuera</button>
      <div ref={dialogRef}>
        <button ref={firstRef} type="button">Primero</button>
        <button type="button">Segundo</button>
      </div>
    </>
  )
}

describe('useDialog: foco y teclado', () => {
  it('al abrirse enfoca el control inicial', () => {
    render(<DialogHarness onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus()
  })

  it('Escape cierra, salvo que el diálogo esté bloqueado', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const { unmount } = render(<DialogHarness onClose={onClose} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    unmount()

    const locked = vi.fn()
    render(<DialogHarness locked onClose={locked} />)
    await user.keyboard('{Escape}')
    expect(locked).not.toHaveBeenCalled()
  })

  it('Shift+Tab desde el primer control lleva al último, y Tab desde el último vuelve al primero', async () => {
    const user = userEvent.setup()
    render(<DialogHarness onClose={vi.fn()} />)

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(screen.getByRole('button', { name: 'Segundo' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus()
  })

  it('al cerrarse devuelve el foco al elemento que tenía antes', () => {
    function Mount({ show }: { show: boolean }) {
      return show ? <DialogHarness onClose={vi.fn()} /> : null
    }
    const { rerender } = render(
      <>
        <button type="button">Abrir</button>
        <Mount show={false} />
      </>,
    )
    screen.getByRole('button', { name: 'Abrir' }).focus()

    rerender(
      <>
        <button type="button">Abrir</button>
        <Mount show />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus()

    rerender(
      <>
        <button type="button">Abrir</button>
        <Mount show={false} />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus()
  })
})

function PagedList({ count }: { count: number }) {
  const items = Array.from({ length: count }, (_, i) => `Elemento ${String(i + 1)}`)
  const pager = usePagination(items)
  return (
    <>
      <ul>
        {pager.pageItems.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <Pagination label="elementos" {...pager} onPage={pager.setPage} />
    </>
  )
}

describe('paginación: navegación con botones', () => {
  it('muestra 5 elementos por página y los botones de página y anterior/siguiente cambian la página', async () => {
    const user = userEvent.setup()
    render(<PagedList count={12} />)
    expect(PAGE_SIZE).toBe(5)
    expect(screen.getByText('Elemento 1')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 1–5 de 12')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Página 2' }))
    expect(screen.getByText('Elemento 6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Siguiente página' }))
    expect(screen.getByText('Elemento 11')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(screen.getByText('Elemento 6')).toBeInTheDocument()
  })

  it('una lista vacía no muestra la paginación', () => {
    render(<PagedList count={0} />)

    expect(screen.queryByRole('navigation', { name: 'Paginación de elementos' })).toBeNull()
  })

  it('la paginación nombra la lista y lleva el número de página actual', () => {
    render(<PagedList count={6} />)
    const nav = screen.getByRole('navigation', { name: 'Paginación de elementos' })

    expect(within(nav).getByText(/DE 2/)).toBeInTheDocument()
  })
})

describe('ComingSoon', () => {
  it('muestra el título, la descripción y la fase en la que se habilita', () => {
    render(<ComingSoon title="Reportes" phase={3} description="Estadísticas de entrega." />)

    expect(screen.getByRole('heading', { name: 'Reportes' })).toBeInTheDocument()
    expect(screen.getByText('Estadísticas de entrega.')).toBeInTheDocument()
    expect(screen.getByText(/fase 3/)).toBeInTheDocument()
  })
})
