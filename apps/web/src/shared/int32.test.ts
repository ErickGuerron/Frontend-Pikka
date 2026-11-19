import { describe, expect, it } from 'vitest'
import { toInt32 } from './int32'

/** Native 32-bit wrap, used as the reference (Int32Array applies ToInt32 like the bitwise operators). */
const reference = (value: number) => Int32Array.of(value)[0]

describe('toInt32', () => {
  it('keeps values already inside the signed 32-bit range', () => {
    expect(toInt32(0)).toBe(0)
    expect(toInt32(-1)).toBe(-1)
    expect(toInt32(2147483647)).toBe(2147483647)
    expect(toInt32(-2147483648)).toBe(-2147483648)
  })

  it('wraps values that overflow the signed 32-bit range', () => {
    expect(toInt32(2147483648)).toBe(-2147483648)
    expect(toInt32(-2147483649)).toBe(2147483647)
    expect(toInt32(4294967296 + 5)).toBe(5)
  })

  it('truncates fractions toward zero before wrapping', () => {
    expect(toInt32(1.9)).toBe(1)
    expect(toInt32(-1.9)).toBe(-1)
  })

  it('matches the native 32-bit wrap for hash-sized intermediate values', () => {
    for (let hash = -4000000000; hash <= 4000000000; hash += 9973) {
      expect(toInt32(hash * 31 + 97)).toBe(reference(hash * 31 + 97))
    }
  })
})
