import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useCurrentUser, useLogout } from '@/features/auth/hooks'
import { roleLabels } from '@/features/auth/types'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'

function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'PK'
  )
}

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
    <header className="fixed top-0 left-64 right-0 h-14 bg-[#f0fafb]/95 backdrop-blur-md border-b border-[#cce7ea] z-40 flex items-center justify-end px-6 font-mono text-xs">
      <div className="relative" onKeyDown={onMenuKeyDown} ref={wrapRef}>
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Menú de cuenta de ${name}`}
          className={`flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-lg border border-[#cce7ea] hover:border-[#004b4e] transition-colors cursor-pointer touch-manipulation ${focusRing}`}
          onClick={() => { setOpen((v) => !v) }}
          ref={avatarRef}
          type="button"
        >
          <span className="text-right flex flex-col leading-tight">
            <span className="font-sans text-xs font-bold text-[#004b4e]">
              {user ? user.fullName : 'Cargando…'}
            </span>
            <span className="font-mono text-[10px] text-[#557b7f]">
              {user ? `${user.email} · ${roleLabels[user.role]}` : ''}
            </span>
          </span>
          <div className="w-7 h-7 rounded bg-[#004b4e] flex items-center justify-center text-white text-[10px] font-bold border border-[#004b4e] font-mono">
            {user ? getInitials(user.fullName) : 'AP'}
          </div>
        </button>
        {open && (
          <div
            aria-label="Cuenta"
            className="absolute right-0 top-full mt-2 min-w-44 bg-white rounded-xl border border-[#cce7ea] shadow-[0_8px_24px_-4px_rgba(0,38,40,0.16)] p-1 animate-menu-in origin-top-right z-50"
            ref={menuRef}
            role="menu"
          >
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/50 transition-colors cursor-pointer ${focusRing}`}
              onClick={logout}
              role="menuitem"
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-sm">logout</span>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
