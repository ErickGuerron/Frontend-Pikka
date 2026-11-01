import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  title: string
  titleId: string
  onClose: () => void
  children: ReactNode
  /** Wider panel for forms that embed a map. */
  wide?: boolean
  /** Short uppercase tag above the title (portal style). */
  eyebrow?: string
}

/** Minimal accessible modal: backdrop, Escape to close, labelled dialog. */
export function Modal({ title, titleId, onClose, children, wide = false, eyebrow }: ModalProps) {
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
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface-container-lowest p-5 shadow-xl sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}
      >
        {eyebrow === undefined ? null : (
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider text-secondary">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-secondary-fixed-dim" />
            {eyebrow}
          </span>
        )}
        <h2 id={titleId} className="mb-4 text-xl font-bold tracking-tight text-on-surface">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
