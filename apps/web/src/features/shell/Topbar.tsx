import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useCurrentUser, useLogout } from '@/features/auth/hooks'
import { roleLabels } from '@/features/auth/types'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'

export function Topbar() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Clic fuera cierra el menú sin robar el foco.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => { document.removeEventListener('pointerdown', onPointerDown) }
  }, [open])

  // Al abrir, el foco pasa al primer elemento del menú.
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [open])

  const close = () => {
    setOpen(false)
    avatarRef.current?.focus()
  }

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    if (items.length === 0) return
    e.preventDefault()
    const current = items.indexOf(document.activeElement as HTMLElement)
    const step = e.key === 'ArrowDown' ? 1 : -1
    const next = (current + step + items.length) % items.length
    items[next]?.focus()
  }

  const name = user?.fullName ?? ''

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-end px-space-lg">
      <div className="relative" onKeyDown={onMenuKeyDown} ref={wrapRef}>
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Menú de cuenta de ${name}`}
          className={`flex items-center gap-space-md rounded-lg px-1.5 py-1 hover:bg-surface-container-low transition-colors cursor-pointer touch-manipulation ${focusRing}`}
          onClick={() => { setOpen((v) => !v) }}
          ref={avatarRef}
          type="button"
        >
          <span className="text-right flex flex-col">
            <span className="font-body-md text-body-md font-semibold text-on-surface leading-tight">
              {user ? `${user.fullName} · ${roleLabels[user.role]}` : 'Cargando…'}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">{user?.email ?? ''}</span>
          </span>
          <img
            alt=""
            className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-fixed"
            src="https://lh3.googleusercontent.com/aida/AEtjO1U5476N65UG5b8LIbeNyDiuL6dGo2gG2HEOhVi9vj2tUpaaCovo_E6gEzkEt6u04W6yfTBUl47aKPbH1tGrq1r2wtsHp6XzyCnnibHcbcLK0AqYzFDsh7xKYhzAUuxUcVjX-GuUygXythMCzrSlU4i_JlUmWymebVv6GNZEvTGg9L-EG32qvvVNaY-mcyPg1YSXfE_y5bwB26nBdZg8tXdF9Tl5TcTQXhzWKhpZ6r11Rr5aNHfMngsi1EeQTHLzR_jcR6IIARwnEQ"
          />
        </button>
        {open && (
          <div
            aria-label="Cuenta"
            className="absolute right-0 top-full mt-2 min-w-44 bg-surface-container-lowest rounded-xl border border-surface-container shadow-[0_8px_24px_-4px_rgba(19,42,47,0.16)] p-1 animate-menu-in origin-top-right"
            ref={menuRef}
            role="menu"
          >
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-body-sm text-body-sm font-medium text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer ${focusRing}`}
              onClick={logout}
              role="menuitem"
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg">logout</span>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
