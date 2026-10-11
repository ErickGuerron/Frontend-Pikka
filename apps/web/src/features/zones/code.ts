/**
 * Código de zona: prefijo derivado del nombre + número secuencial (NORTE-001).
 * El backend asigna el número al guardar, así que aquí solo se muestra una vista previa.
 * Esta regla es la misma que CodePrefixFromName en Zone Service (domain/code.go):
 * cambiarla exige cambiarla en los dos lados. Las pruebas usan los mismos ejemplos.
 */

const MAX_PREFIX_LENGTH = 6
const FALLBACK_PREFIX = 'ZONA'
const NUMBER_WIDTH = 3
const GENERIC_WORDS = new Set(['ZONA', 'SECTOR', 'AREA'])

const ACCENTS: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n',
  Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ü: 'U', Ñ: 'N',
}

/** Quita tildes y deja solo letras A-Z, en mayúsculas. */
function lettersOnly(word: string): string {
  return word
    .replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, (char) => ACCENTS[char] ?? char)
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
}

/** Primera palabra distintiva del nombre, en mayúsculas, sin acentos, de hasta seis letras. */
export function codePrefixFromName(name: string): string {
  for (const word of name.trim().split(/\s+/)) {
    const letters = lettersOnly(word)
    if (letters === '' || GENERIC_WORDS.has(letters)) continue
    return letters.slice(0, MAX_PREFIX_LENGTH)
  }
  return FALLBACK_PREFIX
}

/** Vista previa del código: el número aún no existe, así que se muestra como ###. */
export function codePreview(name: string): string {
  return `${codePrefixFromName(name)}-${'#'.repeat(NUMBER_WIDTH)}`
}
