import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ZoneTabs } from './ZoneTabs'

type Id = 'list' | 'editor'

describe('pestañas del panel de zonas', () => {
  it('marca solo la pestaña activa como seleccionada', () => {
    render(<ZoneTabs<Id> label="Panel de zonas" active="editor" onChange={vi.fn()} tabs={[{ id: 'list', label: 'Zonas' }, { id: 'editor', label: 'Editor' }]} />)

    expect(screen.getByRole('tablist', { name: 'Panel de zonas' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Zonas' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: 'Editor' })).toHaveAttribute('aria-selected', 'true')
  })

  it('avisa del id de la pestaña que el usuario elige', async () => {
    const user = userEvent.setup({ delay: null })
    const onChange = vi.fn()
    render(<ZoneTabs<Id> label="Panel" active="list" onChange={onChange} tabs={[{ id: 'list', label: 'Zonas' }, { id: 'editor', label: 'Editor' }]} />)

    await user.click(screen.getByRole('tab', { name: 'Editor' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith('editor')
  })

  it('muestra el contador cuando hay un número, incluido cero', () => {
    render(<ZoneTabs<Id> label="Panel" active="list" onChange={vi.fn()} tabs={[{ id: 'list', label: 'Zonas', badge: 0 }]} />)

    expect(screen.getByRole('tab', { name: /^Zonas/ })).toHaveTextContent(/^Zonas0$/)
  })

  it('no muestra contador cuando el badge es null o no se envía', () => {
    render(
      <ZoneTabs<Id>
        label="Panel"
        active="list"
        onChange={vi.fn()}
        tabs={[{ id: 'list', label: 'Zonas', badge: null }, { id: 'editor', label: 'Editor' }]}
      />,
    )

    expect(screen.getByRole('tab', { name: 'Zonas' })).toHaveTextContent(/^Zonas$/)
    expect(screen.getByRole('tab', { name: 'Editor' })).toHaveTextContent(/^Editor$/)
  })

  it('muestra un punto de aviso solo en la pestaña marcada con dot', () => {
    const { container } = render(
      <ZoneTabs<Id> label="Panel" active="list" onChange={vi.fn()} tabs={[{ id: 'list', label: 'Zonas' }, { id: 'editor', label: 'Editor', dot: true }]} />,
    )

    const dots = container.querySelectorAll('span.rounded-full.bg-primary')
    expect(dots).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'Editor' }).contains(dots[0] ?? null)).toBe(true)
  })
})
