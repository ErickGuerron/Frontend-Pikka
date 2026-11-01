import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MapToolbar, type MapToolbarProps, type MapTool } from './MapToolbar'

const ADD = 'Agregar vértice (1): clic en el mapa'
const HOLE = 'Dibujar exclusión (2)'
const ERASE = 'Quitar vértice (3): clic sobre el vértice'
const DEPOT = 'Fijar bodega de salida (4): clic en el mapa'
const UNDO = 'Deshacer (Ctrl+Z)'
const CLEAR = 'Borrar trazo actual (Esc)'
const FIT = 'Centrar en la figura (F)'

function renderToolbar(overrides: Partial<MapToolbarProps> = {}) {
  const props: MapToolbarProps = {
    tool: 'add',
    holeActive: false,
    canUndo: true,
    canClear: true,
    canFit: true,
    onTool: vi.fn<(tool: MapTool) => void>(),
    onHole: vi.fn(),
    onUndo: vi.fn(),
    onClear: vi.fn(),
    onFit: vi.fn(),
    ...overrides,
  }
  render(<MapToolbar {...props} />)
  return props
}

describe('barra de herramientas del mapa', () => {
  it('se presenta como barra con nombre accesible', () => {
    renderToolbar()

    expect(screen.getByRole('toolbar', { name: 'Herramientas del mapa' })).toBeInTheDocument()
  })

  it('marca como activa la herramienta agregar mientras no se dibuja un hueco', () => {
    renderToolbar({ tool: 'add', holeActive: false })

    expect(screen.getByRole('button', { name: ADD })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: ERASE })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: DEPOT })).toHaveAttribute('aria-pressed', 'false')
  })

  it('quita la marca de agregar cuando se dibuja un hueco y marca la exclusión', () => {
    renderToolbar({ tool: 'add', holeActive: true })

    expect(screen.getByRole('button', { name: ADD })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: HOLE })).toHaveAttribute('aria-pressed', 'true')
  })

  it('elegir la exclusión llama onHole sin cambiar la herramienta', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderToolbar()

    await user.click(screen.getByRole('button', { name: HOLE }))

    expect(props.onHole).toHaveBeenCalledOnce()
    expect(props.onTool).not.toHaveBeenCalled()
  })

  it('elegir quitar vértice desde agregar activa la herramienta erase', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderToolbar({ tool: 'add' })

    await user.click(screen.getByRole('button', { name: ERASE }))

    expect(props.onTool).toHaveBeenCalledExactlyOnceWith('erase')
  })

  it('con quitar vértice ya activa, el mismo botón vuelve a agregar', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderToolbar({ tool: 'erase' })

    expect(screen.getByRole('button', { name: ERASE })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: ERASE }))

    expect(props.onTool).toHaveBeenCalledExactlyOnceWith('add')
  })

  it('con la bodega activa, el mismo botón vuelve a agregar', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderToolbar({ tool: 'depot' })

    expect(screen.getByRole('button', { name: DEPOT })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: DEPOT }))

    expect(props.onTool).toHaveBeenCalledExactlyOnceWith('add')
  })

  it('elegir fijar bodega desde otra herramienta la activa', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderToolbar({ tool: 'add' })

    await user.click(screen.getByRole('button', { name: DEPOT }))

    expect(props.onTool).toHaveBeenCalledExactlyOnceWith('depot')
  })

  it('elegir agregar vértice avisa a la herramienta add', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderToolbar({ tool: 'erase' })

    await user.click(screen.getByRole('button', { name: ADD }))

    expect(props.onTool).toHaveBeenCalledExactlyOnceWith('add')
  })

  it('deshacer, borrar y encuadrar disparan su acción cuando están disponibles', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderToolbar()

    await user.click(screen.getByRole('button', { name: UNDO }))
    await user.click(screen.getByRole('button', { name: CLEAR }))
    await user.click(screen.getByRole('button', { name: FIT }))

    expect(props.onUndo).toHaveBeenCalledOnce()
    expect(props.onClear).toHaveBeenCalledOnce()
    expect(props.onFit).toHaveBeenCalledOnce()
  })

  it('deshabilita deshacer, borrar y encuadrar cuando no hay nada que hacer', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderToolbar({ canUndo: false, canClear: false, canFit: false })

    expect(screen.getByRole('button', { name: UNDO })).toBeDisabled()
    expect(screen.getByRole('button', { name: CLEAR })).toBeDisabled()
    expect(screen.getByRole('button', { name: FIT })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: UNDO }))
    expect(props.onUndo).not.toHaveBeenCalled()
  })

  it('muestra la explicación de cada herramienta como texto de su tooltip', () => {
    renderToolbar()

    expect(screen.getByText(ERASE, { selector: 'span' })).toHaveAttribute('aria-hidden', 'true')
  })
})
