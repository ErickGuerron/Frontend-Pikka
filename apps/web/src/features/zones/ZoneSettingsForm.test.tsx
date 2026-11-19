import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SettingsForm } from './settings'
import { ZoneSettingsForm } from './ZoneSettingsForm'

const valid: SettingsForm = {
  description: '',
  depotName: 'Hub Norte',
  depotLatitude: '-0.179',
  depotLongitude: '-78.483',
  maxOrdersPerRoute: '4',
  routeCapacityKg: '45',
  timezone: 'America/Guayaquil',
  serviceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  deliveryWindowFrom: '08:00',
  deliveryWindowTo: '20:00',
  cutoffTime: '14:00',
  dispatchTime: '15:30',
  priority: 'NORMAL',
  dailyOrderLimit: '250',
}

function renderForm(value: SettingsForm = valid) {
  const onChange = vi.fn<(next: SettingsForm) => void>()
  render(<ZoneSettingsForm value={value} onChange={onChange} />)
  return onChange
}

describe('configuración operativa de la zona', () => {
  it('muestra las tres secciones y la zona horaria de la configuración', () => {
    renderForm()

    expect(screen.getByRole('heading', { name: /Depósito y capacidad de ruta/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Ventanas y tiempos de corte/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Prioridad y cupo diario/ })).toBeInTheDocument()
    expect(screen.getByText('America/Guayaquil')).toBeInTheDocument()
  })

  it('no muestra alertas cuando todos los valores son válidos', () => {
    renderForm()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Obligatorio · al menos un día')).toBeInTheDocument()
  })

  it('escribir el nombre de la bodega entrega el formulario completo con el nuevo valor', async () => {
    const user = userEvent.setup({ delay: null })
    const onChange = renderForm()

    await user.type(screen.getByPlaceholderText('Ej. Hub Norte'), 'X')

    expect(onChange).toHaveBeenLastCalledWith({ ...valid, depotName: 'Hub NorteX' })
  })

  it('escribe la descripción de cobertura sin validar su contenido', async () => {
    const user = userEvent.setup({ delay: null })
    const onChange = renderForm()

    await user.type(screen.getByPlaceholderText('Ej. Zona comercial con alta densidad residencial'), 'Q')

    expect(onChange).toHaveBeenLastCalledWith({ ...valid, description: 'Q' })
  })

  it('escribir latitud y longitud de la bodega actualiza esos campos', async () => {
    const user = userEvent.setup({ delay: null })
    const onChange = renderForm({ ...valid, depotLatitude: '', depotLongitude: '' })

    await user.type(screen.getByPlaceholderText('Ej. -0.179000'), '1')
    await user.type(screen.getByPlaceholderText('Ej. -78.483000'), '2')

    expect(onChange).toHaveBeenLastCalledWith({ ...valid, depotLatitude: '', depotLongitude: '2' })
    expect(onChange).toHaveBeenCalledWith({ ...valid, depotLatitude: '1', depotLongitude: '' })
  })

  it('pedidos por ruta descarta todo lo que no sea dígito', () => {
    const onChange = renderForm()

    fireEvent.change(screen.getByPlaceholderText('Ej. 18'), { target: { value: '4a' } })

    expect(onChange).toHaveBeenLastCalledWith({ ...valid, maxOrdersPerRoute: '4' })
  })

  it('capacidad por ruta conserva dígitos y punto decimal y descarta letras', () => {
    const onChange = renderForm()

    fireEvent.change(screen.getByPlaceholderText('Ej. 45'), { target: { value: '45.5kg' } })

    expect(onChange).toHaveBeenLastCalledWith({ ...valid, routeCapacityKg: '45.5' })
  })

  it('límite diario descarta todo lo que no sea dígito', () => {
    const onChange = renderForm()

    fireEvent.change(screen.getByPlaceholderText('Ej. 250'), { target: { value: '25x' } })

    expect(onChange).toHaveBeenLastCalledWith({ ...valid, dailyOrderLimit: '25' })
  })

  it('elegir un día de servicio activo lo quita de la lista', async () => {
    const user = userEvent.setup({ delay: null })
    const onChange = renderForm()

    await user.click(screen.getByRole('button', { name: 'Lun' }))

    expect(onChange).toHaveBeenCalledWith({ ...valid, serviceDays: ['TUE', 'WED', 'THU', 'FRI', 'SAT'] })
  })

  it('elegir un día inactivo lo agrega en su orden de la semana', async () => {
    const user = userEvent.setup({ delay: null })
    const onChange = renderForm()

    await user.click(screen.getByRole('button', { name: 'Dom' }))

    expect(onChange).toHaveBeenCalledWith({ ...valid, serviceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] })
  })

  it('marca los días de servicio con aria-pressed', () => {
    renderForm()

    expect(screen.getByRole('button', { name: 'Lun' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dom' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('cambiar la prioridad entrega la opción elegida', async () => {
    const user = userEvent.setup({ delay: null })
    const onChange = renderForm()

    await user.selectOptions(screen.getByRole('combobox'), 'HIGH')

    expect(onChange).toHaveBeenLastCalledWith({ ...valid, priority: 'HIGH' })
  })

  it('cambiar las horas de la ventana, corte y despacho entrega cada campo', () => {
    const onChange = renderForm()

    fireEvent.change(screen.getByLabelText(/Inicio ventana/), { target: { value: '07:00' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...valid, deliveryWindowFrom: '07:00' })

    fireEvent.change(screen.getByLabelText(/Fin ventana/), { target: { value: '21:00' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...valid, deliveryWindowTo: '21:00' })

    fireEvent.change(screen.getByLabelText(/Hora de corte/), { target: { value: '13:00' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...valid, cutoffTime: '13:00' })

    fireEvent.change(screen.getByLabelText(/Hora de despacho/), { target: { value: '16:00' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...valid, dispatchTime: '16:00' })
  })

  it('pide la bodega cuando el nombre está vacío, sin marcarlo como error', () => {
    renderForm({ ...valid, depotName: '' })

    expect(screen.getByText(/Obligatorio · Solo letras, 3 a 120 caracteres/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ej. Hub Norte')).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('marca el nombre de la bodega como inválido y explica el límite de caracteres', () => {
    renderForm({ ...valid, depotName: 'AB' })

    expect(screen.getByRole('alert')).toHaveTextContent('La bodega debe tener entre 3 y 120 caracteres.')
    expect(screen.getByPlaceholderText('Ej. Hub Norte')).toHaveAttribute('aria-invalid', 'true')
  })

  it('rechaza una bodega con dígitos o símbolos no permitidos', () => {
    renderForm({ ...valid, depotName: 'Hub 9' })

    expect(screen.getByRole('alert')).toHaveTextContent("La bodega solo admite letras, espacios y . - '.")
  })

  it('pide la latitud con el rango de Ecuador cuando falta', () => {
    renderForm({ ...valid, depotLatitude: '' })

    expect(screen.getByText('Obligatorio · Ecuador: entre -5 y 2')).toBeInTheDocument()
  })

  it('rechaza una latitud fuera de Ecuador y muestra el motivo', () => {
    renderForm({ ...valid, depotLatitude: '50' })

    expect(screen.getByRole('alert')).toHaveTextContent('La latitud debe estar en Ecuador: entre -5 y 2.')
  })

  it('rechaza una longitud fuera de Ecuador y muestra el motivo', () => {
    renderForm({ ...valid, depotLongitude: '-10' })

    expect(screen.getByRole('alert')).toHaveTextContent('La longitud debe estar en Ecuador: entre -92 y -75.')
  })

  it('rechaza una longitud no numérica con la indicación de su rango', () => {
    renderForm({ ...valid, depotLongitude: 'abc' })

    expect(screen.getByRole('alert')).toHaveTextContent('Indica la longitud de la bodega (entre -92 y -75).')
  })

  it('rechaza más pedidos por ruta que el máximo permitido', () => {
    renderForm({ ...valid, maxOrdersPerRoute: '60' })

    expect(screen.getByRole('alert')).toHaveTextContent('El máximo de pedidos por ruta debe ser un entero entre 1 y 50.')
  })

  it('rechaza una capacidad por ruta de cero kilos', () => {
    renderForm({ ...valid, routeCapacityKg: '0' })

    expect(screen.getByRole('alert')).toHaveTextContent('La capacidad por ruta debe ser un número entre 1 y 1000 kg.')
  })

  it('avisa que debe haber al menos un día de servicio y no marca ningún día', () => {
    renderForm({ ...valid, serviceDays: [] })

    expect(screen.getByText('Selecciona al menos un día de servicio.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lun' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('exige horas HH:MM en la ventana de entrega', () => {
    renderForm({ ...valid, deliveryWindowFrom: '8am' })

    expect(screen.getByRole('alert')).toHaveTextContent('La ventana de entrega debe tener horas HH:MM.')
  })

  it('exige que el inicio de la ventana sea anterior a su fin', () => {
    renderForm({ ...valid, deliveryWindowFrom: '20:00', deliveryWindowTo: '08:00' })

    expect(screen.getByRole('alert')).toHaveTextContent('El inicio de la ventana debe ser anterior a su fin.')
  })

  it('pide la hora de corte cuando falta, sin marcarla como error', () => {
    renderForm({ ...valid, cutoffTime: '' })

    expect(screen.getByText('Obligatorio · Hasta aquí entran pedidos del día')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('rechaza una hora de despacho mal formada', () => {
    renderForm({ ...valid, dispatchTime: '3pm' })

    expect(screen.getByRole('alert')).toHaveTextContent('Las horas de corte y despacho deben ser HH:MM.')
  })

  it('rechaza un límite diario de cero pedidos', () => {
    renderForm({ ...valid, dailyOrderLimit: '0' })

    expect(screen.getByRole('alert')).toHaveTextContent('El límite diario debe ser un entero entre 1 y 10000.')
  })

  it('rechaza una descripción que supera el máximo de caracteres', () => {
    renderForm({ ...valid, description: 'x'.repeat(501) })

    expect(screen.getByRole('alert')).toHaveTextContent('La descripción no puede pasar de 500 caracteres.')
  })

  it('muestra el límite de la descripción como texto opcional cuando es válida', () => {
    renderForm()

    expect(screen.getByText('Opcional · máximo 500 caracteres')).toBeInTheDocument()
  })
})
