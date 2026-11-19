import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/errors'
import { App } from './App'
import { NotFoundPage } from './NotFoundPage'
import { createQueryClient } from './query-client'

describe('página de ruta no encontrada', () => {
  it('la página se renderiza sola dentro de un router', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
  })
})

describe('cliente de consulta de la app', () => {
  // Reintentar un 4xx no cambia el resultado: solo se reintentan fallos de red o del servidor, hasta 2 veces.
  function retryPolicy() {
    const retry = createQueryClient().getDefaultOptions().queries?.retry
    if (typeof retry !== 'function') throw new Error('se esperaba una función de reintento')
    return retry
  }

  it('no reintenta errores 4xx de la API', () => {
    const retry = retryPolicy()

    expect(retry(0, new ApiError(404, 'NOT_FOUND', 'no existe'))).toBe(false)
    expect(retry(0, new ApiError(422, 'VALIDATION', 'inválido'))).toBe(false)
  })

  it('reintenta errores de servidor y de red, pero no más de dos veces', () => {
    const retry = retryPolicy()

    expect(retry(0, new ApiError(500, 'INTERNAL', 'fallo'))).toBe(true)
    expect(retry(1, new Error('network down'))).toBe(true)
    expect(retry(2, new ApiError(500, 'INTERNAL', 'fallo'))).toBe(false)
  })
})

describe('componente raíz de la app', () => {
  it('monta el router y el cliente de consulta sin fallar', () => {
    const { container } = render(<App />)

    expect(container).not.toBeEmptyDOMElement()
  })
})
