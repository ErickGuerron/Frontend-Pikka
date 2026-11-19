import type { ReactNode } from 'react'

/** Estilo único de los campos de texto. Cambiarlo aquí cambia todos los formularios. */
export const inputClass =
  'w-full bg-white border border-[#cce7ea] rounded-lg px-3 py-2 text-xs font-sans text-[#061f23] focus:outline-none focus:ring-2 focus:ring-[#004b4e]/30 focus:border-[#004b4e] disabled:opacity-60 aria-[invalid=true]:border-error transition-all'

/** Estilo de la etiqueta de cada campo. */
export const fieldLabelClass = 'text-[10px] font-mono font-bold uppercase tracking-wider text-[#557b7f]'

export interface FieldProps {
  label: string
  children: ReactNode
}

/** Etiqueta envolvente: el control queda asociado a su texto sin repetir clases. */
export function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className={fieldLabelClass}>{label}</span>
      {children}
    </label>
  )
}

export interface ErrorMessageProps {
  children: ReactNode
  /** Permite enlazarlo con el control vía aria-describedby. */
  id?: string
  className?: string
}

/** Mensaje de error anunciado a lectores de pantalla. */
export function ErrorMessage({ children, id, className = '' }: ErrorMessageProps) {
  return (
    <p id={id} role="alert" className={`text-[11px] text-error ${className}`.trim()}>
      {children}
    </p>
  )
}
