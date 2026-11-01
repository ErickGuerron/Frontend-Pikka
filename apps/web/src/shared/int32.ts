const TWO_POW_32 = 4294967296
const TWO_POW_31 = 2147483648

/**
 * Wraps a finite number into a signed 32-bit integer, with the same result as `value | 0`.
 * Used by string hashes whose intermediate values must overflow like 32-bit integers.
 */
export function toInt32(value: number): number {
  const unsigned = ((Math.trunc(value) % TWO_POW_32) + TWO_POW_32) % TWO_POW_32
  return unsigned >= TWO_POW_31 ? unsigned - TWO_POW_32 : unsigned
}
