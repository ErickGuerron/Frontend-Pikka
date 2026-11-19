import { useId, useRef } from 'react'
import { useDialog } from './dialog'

interface AlertDialogProps {
  title: string
  message: string
  onClose: () => void
  /** Texto del botón. Por defecto, "Entendido". */
  closeLabel?: string
}

/** Aviso centrado que bloquea la pantalla hasta que se cierra: para decir que algo no se pudo hacer y por qué. */
export function AlertDialog({ title, message, onClose, closeLabel = 'Entendido' }: AlertDialogProps) {
  const titleId = useId()
  const messageId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialog(dialogRef, closeRef, onClose, false)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
      >
        <span
          aria-hidden="true"
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#ffb4ab] text-[#ba1a1a]"
        >
          <span className="material-symbols-outlined text-3xl">close</span>
        </span>
        <h2 id={titleId} className="mb-2 text-lg font-bold text-[#004b4e] font-sans">{title}</h2>
        <p id={messageId} className="mb-5 text-sm text-[#557b7f]">{message}</p>
        <button
          ref={closeRef}
          className="px-6 py-2 rounded-lg bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-[#004b4e]"
          onClick={onClose}
          type="button"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  )
}
