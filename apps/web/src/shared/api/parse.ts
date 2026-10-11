import { isRecord } from './http'

/** Validación mínima en tiempo de ejecución de las respuestas, sin type assertions. */
export class ParseError extends Error {}

export function object(data: unknown, what: string): Record<string, unknown> {
  if (!isRecord(data)) throw new ParseError(`${what}: expected object`)
  return data
}

export function string(obj: Record<string, unknown>, key: string): string {
  const v = obj[key]
  if (typeof v !== 'string') throw new ParseError(`${key}: expected string`)
  return v
}

export function number(obj: Record<string, unknown>, key: string): number {
  const v = obj[key]
  if (typeof v !== 'number') throw new ParseError(`${key}: expected number`)
  return v
}

export function boolean(obj: Record<string, unknown>, key: string): boolean {
  const v = obj[key]
  if (typeof v !== 'boolean') throw new ParseError(`${key}: expected boolean`)
  return v
}

/** Valor de un conjunto cerrado; cualquier otro valor del contrato se rechaza. */
export function enumValue<T extends string>(value: unknown, values: readonly T[], what: string): T {
  const match = values.find((candidate) => candidate === value)
  if (match === undefined) throw new ParseError(`${what}: unexpected value ${String(value)}`)
  return match
}

export function oneOf<T extends string>(obj: Record<string, unknown>, key: string, values: readonly T[]): T {
  return enumValue(string(obj, key), values, key)
}

/** Lista de valores de un conjunto cerrado. */
export function enumArray<T extends string>(obj: Record<string, unknown>, key: string, values: readonly T[]): T[] {
  const v = obj[key]
  if (!Array.isArray(v)) throw new ParseError(`${key}: expected array`)
  return v.map((item) => enumValue(item, values, key))
}
