import { useCurrentUser } from '@/features/auth/hooks'
import { Brand } from '@/features/landing/Brand'
import { initialOf } from './initial'

/** Top bar: menu button (below lg), user name/email and avatar initial. */
export function CustomerTopbar({ onMenu }: { onMenu: () => void }) {
  const { data: user } = useCurrentUser()

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[#cce7ea] bg-white px-4 shadow-xs lg:left-64 lg:px-6">
      <button
        type="button"
        aria-label="Abrir menú"
        className="cursor-pointer rounded-lg p-2 text-[#004b4e] hover:bg-[#e8f7f9] lg:hidden transition-colors"
        onClick={onMenu}
      >
        <span className="material-symbols-outlined text-xl" aria-hidden="true">menu</span>
      </button>
      <div className="lg:hidden">
        <Brand variant="deep" showIsotipo={false} textSize="text-xl" />
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-3">
        <div className="hidden min-w-0 flex-col text-right sm:flex">
          <span className="truncate text-xs font-bold leading-tight text-[#061f23]">{user?.fullName ?? ''}</span>
          <span className="truncate text-[11px] font-mono leading-tight text-[#557b7f]">{user?.email ?? ''}</span>
        </div>
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#004b4e] font-mono text-xs font-bold text-white border border-[#004b4e] shadow-xs">
          {initialOf(user?.fullName)}
        </span>
      </div>
    </header>
  )
}
