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

export function oneOf<T extends string>(obj: Record<string, unknown>, key: string, values: readonly T[]): T {
  const v = string(obj, key)
  const match = values.find((candidate) => candidate === v)
  if (match === undefined) throw new ParseError(`${key}: unexpected value ${v}`)
  return match
}
