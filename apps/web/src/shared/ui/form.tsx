import type { ReactNode } from 'react'

/** Estilo único de los campos de texto. Cambiarlo aquí cambia todos los formularios. */
export const inputClass =
  'w-full bg-surface-container-low border border-surface-container-high rounded-lg px-3 py-2 text-[12px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 aria-[invalid=true]:border-error'

/** Estilo de la etiqueta de cada campo. */
export const fieldLabelClass = 'text-[10px] font-bold uppercase tracking-wider text-on-surface-variant'

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

/** Mensaje de error anunciado a lectores de pantalla. */
export function ErrorMessage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={`text-[11px] text-error ${className}`.trim()}>
      {children}
    </p>
  )
}
