import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/errors'
import { deleteZone, setZoneStatus } from './api'
import { buildZone as makeZone, SQUARE_RING as square } from './zones.fixtures'
import { renderWithQueryClient } from './zones.test-utils'
import { ZoneList, type ZoneListProps } from './ZoneList'
import type { Zone } from './types'

vi.mock('./api', () => ({
  deleteZone: vi.fn(),
  setZoneStatus: vi.fn(),
}))

function buildZone(overrides: Partial<Zone>): Zone {
  return makeZone({ id: 'z-1', code: 'NORTE-001', name: 'Norte Comercial', ...overrides })
}

const norte = buildZone({ id: 'z-1', code: 'NORTE-001', name: 'Norte Comercial' })
const sur = buildZone({ id: 'z-2', code: 'SUR-001', name: 'Sur Residencial', status: 'INACTIVE', statusReason: 'Sin cobertura' })

function renderList(overrides: Partial<ZoneListProps> = {}) {
  const props: ZoneListProps = {
    zones: [sur, norte],
    editingZoneId: null,
    onView: vi.fn(),
    onRedraw: vi.fn(),
    onCancelRedraw: vi.fn(),
    ...overrides,
  }
  renderWithQueryClient(<ZoneList {...props} />)
  return props
}

const reasonField = () => screen.getByRole('textbox', { name: 'Motivo' })

beforeEach(() => {
  vi.mocked(deleteZone).mockReset()
  vi.mocked(setZoneStatus).mockReset()
  vi.mocked(deleteZone).mockResolvedValue(undefined)
  vi.mocked(setZoneStatus).mockResolvedValue(norte)
})

describe('listado de zonas registradas', () => {
  it('muestra las zonas activas antes que las inactivas y el conteo visible', () => {
    renderList()

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Norte Comercial')
    expect(items[1]).toHaveTextContent('Sur Residencial')
    expect(screen.getByText('2 de 2')).toBeInTheDocument()
  })

  it('explica que aún no hay zonas cuando el listado está vacío', () => {
    renderList({ zones: [] })

    expect(screen.getByText('Aún no hay zonas. Dibuja la primera abajo.')).toBeInTheDocument()
    expect(screen.getByText('0 de 0')).toBeInTheDocument()
  })

  it('usa el singular para un hueco y el plural para varios', () => {
    const hole = square.slice(0, 4)
    renderList({
      zones: [buildZone({ holes: [hole] }), buildZone({ id: 'z-3', code: 'CENTRO-001', name: 'Centro', holes: [hole, hole] })],
    })

    expect(screen.getByText(/· 1 hueco/)).toBeInTheDocument()
    expect(screen.getByText(/· 2 huecos/)).toBeInTheDocument()
  })

  it('filtra por nombre o código y muestra el conteo de coincidencias', async () => {
    const user = userEvent.setup({ delay: null })
    renderList()

    await user.type(screen.getByRole('textbox', { name: 'Buscar zona registrada' }), 'sur')

    expect(screen.getByText('1 de 2')).toBeInTheDocument()
    expect(screen.queryByText('Norte Comercial')).not.toBeInTheDocument()
  })

  it('filtra por código ignorando mayúsculas y espacios', async () => {
    const user = userEvent.setup({ delay: null })
    renderList()

    await user.type(screen.getByRole('textbox', { name: 'Buscar zona registrada' }), '  norte-001 ')

    expect(screen.getByRole('button', { name: 'Ver NORTE-001 en el mapa' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver SUR-001 en el mapa' })).not.toBeInTheDocument()
  })

  it('avisa qué búsqueda no encontró ninguna zona', async () => {
    const user = userEvent.setup({ delay: null })
    renderList()

    await user.type(screen.getByRole('textbox', { name: 'Buscar zona registrada' }), 'xyz')

    expect(screen.getByText('Ninguna zona coincide con “xyz”.')).toBeInTheDocument()
  })

  it('muestra la razón del estado de una zona inactiva', () => {
    renderList()

    expect(screen.getByText('Motivo: Sin cobertura')).toBeInTheDocument()
  })

  it('marca la zona que se está redibujando y cambia su acción a cancelar', () => {
    renderList({ editingZoneId: 'z-1' })

    expect(screen.getByText('Editando')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar redibujo NORTE-001' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Redibujar NORTE-001' })).not.toBeInTheDocument()
  })

  it('ver una zona la entrega a onView sin entrar en modo edición', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderList()

    await user.click(screen.getByRole('button', { name: 'Ver NORTE-001 en el mapa' }))

    expect(props.onView).toHaveBeenCalledExactlyOnceWith(norte)
    expect(props.onRedraw).not.toHaveBeenCalled()
  })

  it('redibujar una zona activa la entrega a onRedraw', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderList()

    await user.click(screen.getByRole('button', { name: 'Redibujar NORTE-001' }))

    expect(props.onRedraw).toHaveBeenCalledExactlyOnceWith(norte)
  })

  it('cancelar el redibujo en curso avisa a onCancelRedraw', async () => {
    const user = userEvent.setup({ delay: null })
    const props = renderList({ editingZoneId: 'z-1' })

    await user.click(screen.getByRole('button', { name: 'Cancelar redibujo NORTE-001' }))

    expect(props.onCancelRedraw).toHaveBeenCalledOnce()
  })

  it('una zona inactiva no ofrece redibujar ni desactivar, sino reactivar y eliminar', () => {
    renderList()

    expect(screen.queryByRole('button', { name: 'Redibujar SUR-001' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar SUR-001' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reactivar SUR-001' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar SUR-001' })).toBeInTheDocument()
  })
})

describe('acciones con motivo obligatorio', () => {
  it('desactivar pide el motivo y no llama al servidor si es muy corto', async () => {
    const user = userEvent.setup({ delay: null })
    renderList()

    await user.click(screen.getByRole('button', { name: 'Desactivar NORTE-001' }))
    await user.type(reasonField(), '  abc  ')
    await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Escribe el motivo (mínimo 5 caracteres).')
    expect(reasonField()).toHaveAttribute('aria-invalid', 'true')
    expect(setZoneStatus).not.toHaveBeenCalled()
  })

  it('escribir de nuevo limpia el aviso del motivo corto', async () => {
    const user = userEvent.setup({ delay: null })
    renderList()
    await user.click(screen.getByRole('button', { name: 'Desactivar NORTE-001' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.type(reasonField(), 'a')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('desactivar con motivo válido envía el estado y el motivo recortados', async () => {
    const user = userEvent.setup({ delay: null })
    renderList()

    await user.click(screen.getByRole('button', { name: 'Desactivar NORTE-001' }))
    await user.type(reasonField(), '  Mantenimiento de red  ')
    await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }))

    await waitFor(() => {
      expect(setZoneStatus).toHaveBeenCalledExactlyOnceWith('z-1', 'INACTIVE', 'Mantenimiento de red')
    })
    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: 'Motivo' })).not.toBeInTheDocument()
    })
  })

  it('reactivar envía el estado ACTIVE con el motivo del usuario', async () => {
    const user = userEvent.setup({ delay: null })
    renderList()

    await user.click(screen.getByRole('button', { name: 'Reactivar SUR-001' }))
    expect(reasonField()).toHaveAttribute('placeholder', 'Por qué cambia de estado')
    await user.type(reasonField(), 'Cobertura restablecida')
    await user.click(screen.getByRole('button', { name: 'Confirmar reactivación' }))

    await waitFor(() => {
      expect(setZoneStatus).toHaveBeenCalledExactlyOnceWith('z-2', 'ACTIVE', 'Cobertura restablecida')
    })
  })

  it('eliminar pide motivo y llama al borrado de la zona inactiva', async () => {
    const user = userEvent.setup({ delay: null })
    renderList()

    await user.click(screen.getByRole('button', { name: 'Eliminar SUR-001' }))
    expect(reasonField()).toHaveAttribute('placeholder', 'Por qué se borra la zona')
    await user.type(reasonField(), 'Zona duplicada')
    await user.click(screen.getByRole('button', { name: 'Confirmar borrado' }))

    await waitFor(() => {
      expect(deleteZone).toHaveBeenCalledExactlyOnceWith('z-2', 'Zona duplicada')
    })
  })

  it('cancelar el formulario cierra la acción sin llamar al servidor', async () => {
    const user = userEvent.setup({ delay: null })
    renderList()
    await user.click(screen.getByRole('button', { name: 'Desactivar NORTE-001' }))

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('textbox', { name: 'Motivo' })).not.toBeInTheDocument()
    expect(setZoneStatus).not.toHaveBeenCalled()
  })

  it('abrir otra acción descarta el motivo escrito antes', async () => {
    const user = userEvent.setup({ delay: null })
    renderList()
    await user.click(screen.getByRole('button', { name: 'Desactivar NORTE-001' }))
    await user.type(reasonField(), 'Motivo a medias')

    await user.click(screen.getByRole('button', { name: 'Eliminar SUR-001' }))

    expect(reasonField()).toHaveValue('')
    expect(screen.getAllByRole('textbox', { name: 'Motivo' })).toHaveLength(1)
  })

  it('mientras se guarda el cambio deshabilita el envío y muestra el progreso', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(setZoneStatus).mockReturnValue(new Promise(() => undefined))
    renderList()
    await user.click(screen.getByRole('button', { name: 'Desactivar NORTE-001' }))
    await user.type(reasonField(), 'Mantenimiento de red')

    await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }))

    const saving = await screen.findByRole('button', { name: 'Guardando…' })
    expect(saving).toBeDisabled()
  })

  it('si el servidor rechaza la acción muestra el motivo del fallo', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(deleteZone).mockRejectedValue(new ApiError(409, 'CONFLICT', 'conflict'))
    renderList()
    await user.click(screen.getByRole('button', { name: 'Eliminar SUR-001' }))
    await user.type(reasonField(), 'Zona duplicada')

    await user.click(screen.getByRole('button', { name: 'Confirmar borrado' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo completar la acción. Ya existe un registro con esos datos.')
  })
})
