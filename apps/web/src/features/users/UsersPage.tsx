import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useCurrentUser } from '@/features/auth/hooks'
import { roles, roleLabels, type Role, type User } from '@/features/auth/types'
import { getUsers, usersKey } from './api'
import { roleIcons } from './roleIcons'
import { CreateUserModal, DeactivateUserDialog, EditUserModal } from './UserModals'

type RoleFilter = Role | 'todos'
type EstadoFilter = 'todos' | 'activo' | 'inactivo'

const roleFilterLabels: Record<RoleFilter, string> = {
  todos: 'Todos',
  ADMIN: 'Administradores',
  OPERATOR: 'Operadores',
  DRIVER: 'Repartidores',
  CUSTOMER: 'Clientes',
}
const roleFilters: RoleFilter[] = ['todos', ...roles]

const estadoLabels: Record<EstadoFilter, string> = { todos: 'Todos', activo: 'Activos', inactivo: 'Inactivos' }
const estados: EstadoFilter[] = ['todos', 'activo', 'inactivo']

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'
const PAGE_SIZE = 10

function parsePagina(value: string | null): number {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

function parseRol(value: string | null): RoleFilter {
  return roles.find((r) => r === value) ?? 'todos'
}

function parseEstado(value: string | null): EstadoFilter {
  return estados.find((e) => e === value) ?? 'todos'
}

function matchesEstado(user: User, estado: EstadoFilter): boolean {
  if (estado === 'todos') return true
  return estado === 'activo' ? user.active : !user.active
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'PK'
}

function getRoleBadgeClass(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-primary-container text-on-primary'
    case 'OPERATOR':
      return 'bg-surface-variant text-primary'
    case 'DRIVER':
      return 'bg-secondary-container text-on-secondary-container'
    case 'CUSTOMER':
      return 'bg-surface-variant text-on-surface-variant'
  }
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function UsersPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deactivating, setDeactivating] = useState<User | null>(null)
  const [notice, setNotice] = useState('')
  // Los filtros viven en la URL (?q=&rol=&estado=) para compartirlos y recuperarlos al recargar.
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const roleFilter = parseRol(params.get('rol'))
  const estado = parseEstado(params.get('estado'))
  const requestedPage = parsePagina(params.get('pagina'))

  const { data: me } = useCurrentUser()
  const { data: users = [], refetch, isLoading, isError } = useQuery({
    queryKey: usersKey,
    queryFn: getUsers,
  })

  useEffect(() => {
    if (notice === '') return
    const timer = setTimeout(() => { setNotice('') }, 2800)
    return () => { clearTimeout(timer) }
  }, [notice])

  const setFilter = (key: 'q' | 'rol' | 'estado', value: string, fallback: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === fallback) next.delete(key)
        else next.set(key, value)
        // Un cambio de filtro o búsqueda vuelve a la primera página.
        next.delete('pagina')
        return next
      },
      { replace: true },
    )
  }

  const setPage = (page: number) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (page === 1) next.delete('pagina')
        else next.set('pagina', String(page))
        return next
      },
      { replace: true },
    )
  }

  const query = search.trim().toLowerCase()
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      query === '' ||
      u.fullName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    const matchRole = roleFilter === 'todos' || u.role === roleFilter
    return matchSearch && matchRole && matchesEstado(u, estado)
  })

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(requestedPage, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageUsers = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE)
  const pageEnd = pageStart + pageUsers.length

  const countByRole = (role: Role) => users.filter((u) => u.role === role).length
  const kpis = [
    { label: 'Total', icon: 'groups', value: users.length },
    { label: 'Administradores', icon: 'admin_panel_settings', value: countByRole('ADMIN') },
    { label: 'Operadores', icon: 'tune', value: countByRole('OPERATOR') },
    { label: 'Repartidores', icon: 'two_wheeler', value: countByRole('DRIVER') },
    { label: 'Clientes', icon: 'person', value: countByRole('CUSTOMER') },
  ]
  const hasFilters = search !== '' || roleFilter !== 'todos' || estado !== 'todos'

  return (
    <div className="flex flex-col gap-2 pt-2 pb-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-on-surface tracking-tight">Gestión de Usuarios</h1>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-tight">
            Administra cuentas, roles y accesos del equipo.
          </p>
        </div>
        <button
          className={`flex items-center gap-1 bg-primary hover:bg-on-primary-fixed-variant text-on-primary px-2.5 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer touch-manipulation text-[11px] font-semibold self-start lg:self-auto ${focusRing}`}
          onClick={() => { setIsCreating(true) }}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-sm">person_add</span>
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* KPI Cards: solo conteos calculados desde la lista real */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-surface-container-lowest p-2.5 rounded-xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 flex flex-col gap-1 min-w-0"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-label-badge text-on-surface-variant uppercase font-bold tracking-wider text-[9px] truncate">{kpi.label}</span>
              <span aria-hidden="true" className="material-symbols-outlined text-sm text-primary">{kpi.icon}</span>
            </div>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-lg font-bold text-on-surface tabular-nums">{kpi.value}</span>
              <span className="text-[10px] text-on-surface-variant truncate">cuentas</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0 flex items-center">
          <span aria-hidden="true" className="material-symbols-outlined absolute left-3 text-primary text-base pointer-events-none">search</span>
          <input
            aria-label="Buscar por nombre o correo"
            className={`w-full bg-surface-container-low/70 text-on-surface text-xs pl-9 pr-3 py-2 rounded-lg border-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline-none ${focusRing}`}
            placeholder="Buscar por nombre o correo…"
            type="text"
            value={search}
            onChange={(e) => { setFilter('q', e.target.value, '') }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end flex-shrink-0">
          <div role="group" aria-label="Filtrar por rol" className="flex flex-wrap items-center gap-1 bg-surface-container-low/60 p-0.5 rounded-lg">
            {roleFilters.map((r) => {
              const active = roleFilter === r
              return (
                <button
                  key={r}
                  aria-pressed={active}
                  className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold transition-all touch-manipulation ${focusRing} ${active ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                  onClick={() => { setFilter('rol', r, 'todos') }}
                  type="button"
                >
                  {roleFilterLabels[r]}
                </button>
              )
            })}
          </div>
          <select
            aria-label="Estado"
            className={`bg-surface-container-low/70 text-on-surface text-xs px-2.5 py-1.5 rounded-lg border-0 cursor-pointer font-medium touch-manipulation ${focusRing}`}
            value={estado}
            onChange={(e) => { setFilter('estado', e.target.value, 'todos') }}
          >
            {estados.map((e) => (
              <option key={e} value={e}>{estadoLabels[e]}</option>
            ))}
          </select>
          <button
            aria-label="Refrescar lista"
            className={`p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors border border-surface-container-high touch-manipulation ${focusRing}`}
            onClick={() => void refetch()}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-base">refresh</span>
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 overflow-hidden">
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-surface-container-low/40 border-b border-surface-container">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-bold text-on-surface">Directorio General de Personal</h2>
            <span className="font-label-code bg-surface-container-high text-primary px-2 py-0.5 rounded-md font-bold text-[10px] tabular-nums">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          </div>
          <p aria-live="polite" className="text-[11px] font-semibold text-secondary">{notice}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[480px]">
            <thead>
              <tr className="bg-surface-container/60 text-on-surface-variant font-label-badge uppercase tracking-wider border-b border-surface-container">
                <th className="py-2 px-3 font-bold text-[10px]" scope="col">Usuario</th>
                <th className="py-2 px-2 font-bold text-[10px]" scope="col">Rol</th>
                <th className="py-2 px-2 font-bold text-[10px]" scope="col">Estado</th>
                <th className="py-2 px-3 text-right font-bold text-[10px]" scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low text-xs">
              {isLoading && (
                <tr>
                  <td className="py-6 text-center text-on-surface-variant" colSpan={4}>Cargando…</td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td className="py-6 text-center" colSpan={4}>
                    <p aria-live="polite" className="text-error">No se pudo cargar la lista de usuarios. Intenta de nuevo.</p>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filteredUsers.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-on-surface-variant" colSpan={4}>
                    {hasFilters ? 'No se encontraron usuarios con los filtros aplicados.' : 'No hay usuarios registrados.'}
                  </td>
                </tr>
              )}
              {pageUsers.map((user) => {
                const initials = getInitials(user.fullName)
                const badgeClass = getRoleBadgeClass(user.role)
                // Sin identidad de sesión no se ofrece desactivar a nadie; nunca a la propia sesión.
                // Un usuario ya inactivo tampoco se desactiva de nuevo.
                const canDeactivate = user.active && me !== undefined && me.id !== user.id
                return (
                  <tr key={user.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-2 px-3 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div aria-hidden="true" className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] font-label-code shadow-sm flex-shrink-0 ${badgeClass}`}>
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-on-surface leading-tight truncate text-xs">{user.fullName}</span>
                          <span className="text-[10px] text-on-surface-variant truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-label-badge font-bold shadow-xs whitespace-nowrap ${badgeClass}`}>
                        <span aria-hidden="true" className="material-symbols-outlined text-[10px]">{roleIcons[user.role]}</span>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] whitespace-nowrap ${user.active ? 'bg-secondary-container/40 text-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        <span aria-hidden="true" className={`w-1 h-1 rounded-full ${user.active ? 'bg-secondary' : 'bg-outline'}`} />
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          aria-label={`Editar usuario ${user.fullName}`}
                          className={`p-1 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors touch-manipulation ${focusRing}`}
                          onClick={() => { setEditing(user) }}
                          title="Editar"
                          type="button"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        {canDeactivate && (
                          <button
                            aria-label={`Desactivar usuario ${user.fullName}`}
                            className={`p-1 rounded text-error hover:bg-error-container/40 transition-colors touch-manipulation ${focusRing}`}
                            onClick={() => { setDeactivating(user) }}
                            title="Desactivar"
                            type="button"
                          >
                            <span aria-hidden="true" className="material-symbols-outlined text-sm">block</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <nav aria-label="Paginación de usuarios" className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-surface-container bg-surface-container-low/40">
            <p className="text-[11px] text-on-surface-variant tabular-nums">
              {`Mostrando ${String(pageStart + 1)}–${String(pageEnd)} de ${String(filteredUsers.length)}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                aria-label="Página anterior"
                className={`p-1 rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation ${focusRing}`}
                disabled={currentPage === 1}
                onClick={() => { setPage(currentPage - 1) }}
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  aria-current={page === currentPage ? 'page' : undefined}
                  aria-label={`Página ${String(page)}`}
                  className={`min-w-7 px-2 py-1 rounded-md text-[11px] font-bold tabular-nums transition-colors touch-manipulation ${focusRing} ${page === currentPage ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                  onClick={() => { setPage(page) }}
                  type="button"
                >
                  {page}
                </button>
              ))}
              <button
                aria-label="Siguiente página"
                className={`p-1 rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation ${focusRing}`}
                disabled={currentPage === totalPages}
                onClick={() => { setPage(currentPage + 1) }}
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* Modales */}
      {isCreating && (
        <CreateUserModal
          onClose={() => { setIsCreating(false) }}
          onSaved={(message) => { setNotice(message) }}
        />
      )}
      {editing && (
        <EditUserModal
          key={editing.id}
          onClose={() => { setEditing(null) }}
          onSaved={(message) => { setNotice(message) }}
          user={editing}
        />
      )}
      {deactivating && (
        <DeactivateUserDialog
          onClose={() => { setDeactivating(null) }}
          onSaved={(message) => { setNotice(message) }}
          user={deactivating}
        />
      )}
    </div>
  )
}
