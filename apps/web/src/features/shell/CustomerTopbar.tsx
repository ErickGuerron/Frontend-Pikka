import { useCurrentUser } from '@/features/auth/hooks'
import { initialOf } from './initial'

/** Top bar: menu button (below lg), user name/email and avatar initial. */
export function CustomerTopbar({ onMenu }: { onMenu: () => void }) {
  const { data: user } = useCurrentUser()

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between bg-surface-container-lowest px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:left-64 lg:px-6">
      <button
        type="button"
        aria-label="Abrir menú"
        className="cursor-pointer rounded-lg p-2 text-on-surface hover:bg-surface-container lg:hidden"
        onClick={onMenu}
      >
        <span className="material-symbols-outlined" aria-hidden="true">menu</span>
      </button>
      <span className="text-xl font-bold lowercase text-primary lg:hidden">pikka</span>

      <div className="ml-auto flex min-w-0 items-center gap-3">
        <div className="hidden min-w-0 flex-col text-right sm:flex">
          <span className="truncate text-sm font-semibold leading-tight text-on-surface">{user?.fullName ?? ''}</span>
          <span className="truncate text-xs leading-tight text-on-surface-variant">{user?.email ?? ''}</span>
        </div>
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {initialOf(user?.fullName)}
        </span>
      </div>
    </header>
  )
}
