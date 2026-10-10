import { useCurrentUser, useLogout } from '@/features/auth/hooks'
import { roleLabels } from '@/features/auth/types'

export function Topbar() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg">
      {/* Left: Hub Info */}
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs px-space-md py-1.5 bg-surface-container-low rounded-full text-on-surface-variant border border-surface-container">
          <span className="material-symbols-outlined text-lg text-primary">local_shipping</span>
          <span className="font-body-sm text-body-sm font-semibold text-primary">Hub Central Pikka</span>
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
        </div>
      </div>

      {/* Right: User Profile & Logout */}
      <div className="flex items-center gap-space-lg">
        <div className="flex items-center gap-space-md">
          <div className="text-right flex flex-col">
            <span className="font-body-md text-body-md font-semibold text-on-surface leading-tight">
              {user ? (
                <>
                  {user.fullName} · {roleLabels[user.role]}
                </>
              ) : (
                'Cargando…'
              )}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
              {user?.email ?? ''}
            </span>
          </div>
          <img
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-fixed"
            src="https://lh3.googleusercontent.com/aida/AEtjO1U5476N65UG5b8LIbeNyDiuL6dGo2gG2HEOhVi9vj2tUpaaCovo_E6gEzkEt6u04W6yfTBUl47aKPbH1tGrq1r2wtsHp6XzyCnnibHcbcLK0AqYzFDsh7xKYhzAUuxUcVjX-GuUygXythMCzrSlU4i_JlUmWymebVv6GNZEvTGg9L-EG32qvvVNaY-mcyPg1YSXfE_y5bwB26nBdZg8tXdF9Tl5TcTQXhzWKhpZ6r11Rr5aNHfMngsi1EeQTHLzR_jcR6IIARwnEQ"
          />
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-error-container text-on-surface-variant hover:text-on-error-container transition-all cursor-pointer"
          onClick={logout}
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span className="font-body-sm text-body-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </header>
  )
}
