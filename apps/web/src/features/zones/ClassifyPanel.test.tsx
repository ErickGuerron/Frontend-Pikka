import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ClassifyPanel } from './ClassifyPanel'

const point = { latitude: -0.18073, longitude: -78.4827 }

describe('ClassifyPanel con un punto fuera de cobertura', () => {
  it('muestra que ninguna zona cubre el punto, sin mostrarlo como error de servicio', () => {
    render(
      <ClassifyPanel
        point={point}
        placeLabel="Estación Portugal, Quito"
        zone={null}
        outside
        pending={false}
        failed={false}
        errorMessage={null}
      />,
    )

    expect(screen.getByText('FUERA DE COBERTURA')).toBeInTheDocument()
    expect(screen.getByText('Ninguna zona cubre este punto.')).toBeInTheDocument()
    expect(screen.queryByText(/No pudimos clasificar/)).not.toBeInTheDocument()
  })
})
