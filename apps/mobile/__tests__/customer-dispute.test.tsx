import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native'
import { ApiError } from '../src/api/errors'
import * as api from '../src/features/customer-orders/api'
import { BalanceCard } from '../src/features/customer-orders/BalanceCard'
import { isDisputable, parseMyBalance, type MyBalance } from '../src/features/customer-orders/balance'
import { useOpenDispute } from '../src/features/customer-orders/balance-hooks'
import { disputeErrorText, validateDisputeReason } from '../src/features/customer-orders/dispute'

jest.mock('../src/features/customer-orders/api')
const mocked = jest.mocked(api)

const line = { kind: 'SURCHARGE', id: 's-1', orderId: 'o-1', reason: 'CLIENT_REFUSED', amount: '4.20', startedAt: '2026-10-30T12:00:00Z', dueAt: '2026-11-13T12:00:00Z' }
const body = (over: Record<string, unknown> = {}) => ({ pendingSurcharge: '4.20', accountStatus: 'ACTIVO', blocked: false, simulated: true, lines: [{ ...line, ...over }] })
const balanceOf = (over: Record<string, unknown> = {}): MyBalance => parseMyBalance(body(over))

describe('balance lines and disputes', () => {
  it('reads the dispute state and the deadline; without them they are empty', () => {
    const [plain, disputed, open] = parseMyBalance({ ...body(), lines: [line, { ...line, disputeStatus: 'OPEN' }, { ...line, disputableUntil: '2099-01-01T00:00:00Z' }] }).lines
    expect(plain).toMatchObject({ disputeStatus: '', disputableUntil: '' })
    expect(disputed).toMatchObject({ disputeStatus: 'OPEN', disputableUntil: '' })
    expect(open).toMatchObject({ disputeStatus: '', disputableUntil: '2099-01-01T00:00:00Z' })
  })

  it('a dispute state this version does not know is ignored instead of breaking the balance', () => {
    expect(balanceOf({ disputeStatus: 'NEW_STATE' }).lines[0]?.disputeStatus).toBe('')
  })

  it('is disputable only before its deadline', () => {
    const l = balanceOf({ disputableUntil: '2026-10-30T14:00:00Z' }).lines[0]!
    expect(isDisputable(l, Date.parse('2026-10-30T13:59:59Z'))).toBe(true)
    expect(isDisputable(l, Date.parse('2026-10-30T14:00:01Z'))).toBe(false)
    expect(isDisputable(balanceOf().lines[0]!)).toBe(false)
  })
})

describe('dispute texts', () => {
  it.each([
    ['', false],
    ['no', false],
    ['     ', false],
    ['Yo estaba en casa', true],
    ['x'.repeat(300), true],
    ['x'.repeat(301), false],
  ])('validates the reason %j', (reason, valid) => {
    expect(validateDisputeReason(reason) === null).toBe(valid)
  })

  it('says what went wrong for each server answer', () => {
    expect(disputeErrorText(new ApiError(422, 'X', 'x', 'r'))).toMatch(/plazo/i)
    expect(disputeErrorText(new ApiError(409, 'X', 'x', 'r'))).toMatch(/ya tiene una disputa/i)
    expect(disputeErrorText(new ApiError(500, 'X', 'x', 'r'))).toMatch(/no pudimos/i)
    expect(disputeErrorText(new Error('down'))).toMatch(/no pudimos/i)
  })
})

async function renderCard(over: Record<string, unknown>, onDispute = jest.fn().mockResolvedValue(null)) {
  const utils = await render(
    <BalanceCard balance={balanceOf(over)} paying={false} outcome={null} onPay={jest.fn()} onDismissOutcome={jest.fn()} onDispute={onDispute} />,
  )
  return { onDispute, ...utils }
}

describe('BalanceCard: disputing a surcharge', () => {
  it('offers the button while it can be disputed and sends only the reason for that line', async () => {
    const { onDispute } = await renderCard({ disputableUntil: '2099-01-01T00:00:00Z' })

    await fireEvent.press(screen.getByLabelText('Disputar'))
    await fireEvent.changeText(screen.getByLabelText('Motivo de la disputa'), 'Yo estaba en casa y nadie tocó')
    await fireEvent.press(screen.getByLabelText('Enviar disputa'))

    await waitFor(() => { expect(onDispute).toHaveBeenCalledWith('s-1', 'Yo estaba en casa y nadie tocó') })
  })

  it('does not send a reason that is too short', async () => {
    const { onDispute } = await renderCard({ disputableUntil: '2099-01-01T00:00:00Z' })

    await fireEvent.press(screen.getByLabelText('Disputar'))
    await fireEvent.changeText(screen.getByLabelText('Motivo de la disputa'), 'no')
    await fireEvent.press(screen.getByLabelText('Enviar disputa'))

    expect(await screen.findByText(/entre 5 y 300/i)).toBeTruthy()
    expect(onDispute).not.toHaveBeenCalled()
  })

  it('shows the server message and lets the customer try again', async () => {
    const { onDispute } = await renderCard({ disputableUntil: '2099-01-01T00:00:00Z' }, jest.fn().mockResolvedValue('El plazo para disputar este recargo ya terminó.'))

    await fireEvent.press(screen.getByLabelText('Disputar'))
    await fireEvent.changeText(screen.getByLabelText('Motivo de la disputa'), 'Yo estaba en casa y nadie tocó')
    await fireEvent.press(screen.getByLabelText('Enviar disputa'))

    expect(await screen.findByText(/plazo/i)).toBeTruthy()
    expect(screen.getByLabelText('Enviar disputa')).toBeTruthy()
    expect(onDispute).toHaveBeenCalledTimes(1)
  })

  it('shows an open dispute as such, without the button', async () => {
    await renderCard({ disputeStatus: 'OPEN' })
    expect(screen.getByText('En disputa')).toBeTruthy()
    expect(screen.queryByLabelText('Disputar')).toBeNull()
  })

  it('shows a dispute ruled against and the surcharge stays in the balance', async () => {
    await renderCard({ disputeStatus: 'AGAINST' })
    expect(screen.getByText('Disputa rechazada')).toBeTruthy()
    expect(screen.getAllByText('$4.20').length).toBeGreaterThan(0)
  })

  it('shows neither button nor state without a deadline', async () => {
    await renderCard({})
    expect(screen.queryByLabelText('Disputar')).toBeNull()
    expect(screen.queryByText('En disputa')).toBeNull()
  })

  it('shows no dispute controls when the screen gives no handler', async () => {
    await render(<BalanceCard balance={balanceOf({ disputableUntil: '2099-01-01T00:00:00Z' })} paying={false} outcome={null} onPay={jest.fn()} onDismissOutcome={jest.fn()} />)
    expect(screen.queryByLabelText('Disputar')).toBeNull()
  })
})

describe('useOpenDispute', () => {
  beforeEach(() => {
    mocked.openDispute.mockReset()
  })

  it('opens the dispute, returns no error and always lets the screen refresh', async () => {
    mocked.openDispute.mockResolvedValue({ id: 'd-1' })
    const onSettled = jest.fn()
    const { result } = await renderHook(() => useOpenDispute(onSettled))

    const error = await result.current.open('s-1', 'Yo estaba en casa')

    expect(error).toBeNull()
    expect(mocked.openDispute).toHaveBeenCalledWith('s-1', 'Yo estaba en casa')
    expect(onSettled).toHaveBeenCalledTimes(1)
  })

  it('returns the message of a rejected dispute and still refreshes', async () => {
    mocked.openDispute.mockRejectedValue(new ApiError(409, 'X', 'x', 'r'))
    const onSettled = jest.fn()
    const { result } = await renderHook(() => useOpenDispute(onSettled))

    const error = await result.current.open('s-1', 'Yo estaba en casa')

    expect(error).toMatch(/ya tiene una disputa/i)
    expect(onSettled).toHaveBeenCalledTimes(1)
  })
})
