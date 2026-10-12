import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  title: string
  titleId: string
  onClose: () => void
  children: ReactNode
  /** Wider panel for forms that embed a map. */
  wide?: boolean
}

/** Minimal accessible modal: backdrop, Escape to close, labelled dialog. */
export function Modal({ title, titleId, onClose, children, wide = false }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-on-background/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface-container-lowest p-5 shadow-xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
      >
        <h2 id={titleId} className="mb-3 text-base font-bold text-on-surface">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
