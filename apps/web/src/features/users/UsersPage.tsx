import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useCurrentUser } from '@/features/auth/hooks'
import { roles, roleLabels, type Role, type User } from '@/features/auth/types'
import { KpiGrid } from '@/shared/ui/kpi'
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

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004b4e] focus-visible:ring-offset-2'
const PAGE_SIZE = 5

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
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'PK'
}

function getUserAvatarStyle(role: Role): { bg: string; text: string; border: string } {
  switch (role) {
    case 'ADMIN':
      return { bg: 'bg-[#004b4e]', text: 'text-white', border: 'border-[#004b4e]' }
    case 'OPERATOR':
      return { bg: 'bg-[#e8f7f9]', text: 'text-[#004b4e]', border: 'border-[#cce7ea]' }
    case 'DRIVER':
      return { bg: 'bg-[#0a6568]', text: 'text-white', border: 'border-[#0a6568]' }
    case 'CUSTOMER':
      return { bg: 'bg-[#f0fafb]', text: 'text-[#557b7f]', border: 'border-[#cce7ea]' }
  }
}

function getRoleBadgeStyle(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-[#004b4e] text-white border border-[#004b4e]'
    case 'OPERATOR':
      return 'bg-white text-[#004b4e] border border-[#cce7ea]'
    case 'DRIVER':
      return 'bg-[#e8f7f9] text-[#004b4e] border border-[#cce7ea]'
    case 'CUSTOMER':
      return 'bg-[#f0fafb] text-[#557b7f] border border-[#cce7ea]'
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
    { label: 'TOTAL CUENTAS', badge: 'GLOBAL', value: users.length, unit: 'integrantes', tag: 'Directorio' },
    { label: 'ADMINISTRADORES', badge: 'SISTEMA', value: countByRole('ADMIN'), unit: 'supervisores', tag: 'Acceso Total' },
    { label: 'OPERADORES', badge: 'CENTROS', value: countByRole('OPERATOR'), unit: 'operativos', tag: 'Despacho' },
    { label: 'REPARTIDORES', badge: 'FLOTA', value: countByRole('DRIVER'), unit: 'conductores', tag: 'Distribución' },
    { label: 'CLIENTES', badge: 'PORTAL', value: countByRole('CUSTOMER'), unit: 'usuarios', tag: 'Plataforma' },
  ]
  const hasFilters = search !== '' || roleFilter !== 'todos' || estado !== 'todos'

  return (
    <div className="flex flex-col gap-5 pt-2 pb-16 font-sans">
      {/* Header Section Bar con Dossier Tag y Botón Primario Editorial */}
      <div className="bg-white rounded border border-[#cce7ea] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#e8f7f9] border border-[#cce7ea] text-[10px] font-mono tracking-widest uppercase text-[#004b4e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" />
            <span>Consola Central · Gestión de Cuentas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#004b4e] flex items-center gap-3">
            Gestión y Telemetría de Usuarios
          </h1>
          <p className="text-xs sm:text-sm text-[#557b7f] font-normal leading-relaxed max-w-2xl">
            Administración centralizada de credenciales, roles de despacho, asignación de centros logísticos y monitoreo de accesos.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            className={`px-4 py-2 bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs uppercase tracking-wider rounded transition-colors border border-[#004b4e] flex items-center gap-2 shadow-sm cursor-pointer ${focusRing}`}
            onClick={() => { setIsCreating(true) }}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-base">person_add</span>
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* KPIs de Telemetría Superior (Estilo Dossier / Radar de Ingeniería con datos reales) */}
      <KpiGrid items={kpis} />

      {/* Directorio General de Personal con Toolbar Técnica */}
      <div className="bg-white rounded border border-[#cce7ea] shadow-sm overflow-hidden">
        {/* Toolbar Superior: Búsqueda y Filtros con diseño Dossier */}
        <div className="p-4 border-b border-[#cce7ea] bg-[#f7fcfc] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 w-full flex items-center min-w-0">
              <span aria-hidden="true" className="material-symbols-outlined absolute left-3 text-[#557b7f] text-base pointer-events-none">search</span>
              <input
                aria-label="Buscar por nombre o correo"
                className={`w-full bg-white text-xs font-mono text-[#061f23] pl-9 pr-4 py-2 rounded border border-[#cce7ea] focus:border-[#004b4e] outline-none placeholder:text-[#8ba7ab] transition-all ${focusRing}`}
                placeholder="Buscar por nombre o correo…"
                type="text"
                value={search}
                onChange={(e) => { setFilter('q', e.target.value, '') }}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 flex-shrink-0">
            <div role="group" aria-label="Filtrar por rol" className="flex items-center gap-1 bg-[#e8f7f9] p-0.5 rounded border border-[#cce7ea] text-xs font-mono">
              {roleFilters.map((r) => {
                const active = roleFilter === r
                return (
                  <button
                    key={r}
                    aria-pressed={active}
                    className={`px-3 py-1 rounded text-[11px] font-mono uppercase tracking-wider transition-all touch-manipulation font-semibold ${focusRing} ${
                      active
                        ? 'bg-[#004b4e] text-white border border-[#004b4e] shadow-xs'
                        : 'text-[#004b4e] hover:bg-white border border-transparent'
                    }`}
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
              className={`bg-white text-[#004b4e] text-xs font-mono px-3 py-1.5 rounded border border-[#cce7ea] cursor-pointer font-semibold outline-none focus:border-[#004b4e] touch-manipulation ${focusRing}`}
              value={estado}
              onChange={(e) => { setFilter('estado', e.target.value, 'todos') }}
            >
              {estados.map((e) => (
                <option key={e} value={e}>{estadoLabels[e]}</option>
              ))}
            </select>
            <button
              aria-label="Refrescar lista"
              title="Recargar filtros"
              className={`p-1.5 bg-white text-[#004b4e] border border-[#cce7ea] hover:border-[#004b4e] hover:bg-[#e8f7f9] rounded transition-colors cursor-pointer touch-manipulation ${focusRing}`}
              onClick={() => void refetch()}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>
        </div>

        {/* Banner técnico de conteo y sincronización */}
        <div className="px-4 py-2 bg-white border-b border-[#cce7ea] flex items-center justify-between text-[11px] font-mono text-[#557b7f]">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold font-mono text-[#004b4e] uppercase tracking-wider">Directorio General de Personal</h2>
            <span className="text-[10px] font-mono bg-[#e8f7f9] text-[#004b4e] px-2 py-0.5 rounded border border-[#cce7ea] font-semibold tabular-nums">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          </div>
          <p aria-live="polite" className="text-[11px] font-mono font-semibold text-[#006b5f]">{notice}</p>
        </div>

        {/* Tabla Técnica de Personal */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans" id="userDirectoryTable">
            <thead>
              <tr className="bg-[#f7fcfc] text-[#557b7f] font-mono text-[10px] uppercase tracking-widest border-b border-[#cce7ea]">
                <th className="py-3 px-4 font-semibold" scope="col">Usuario / Credenciales</th>
                <th className="py-3 px-3 font-semibold" scope="col">Rol Logístico</th>
                <th className="py-3 px-3 font-semibold" scope="col">Estado</th>
                <th className="py-3 px-4 text-right font-semibold" scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cce7ea] text-xs">
              {isLoading && (
                <tr>
                  <td className="py-8 text-center text-[#557b7f] font-mono text-xs" colSpan={4}>Cargando…</td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td className="py-8 text-center" colSpan={4}>
                    <p aria-live="polite" className="text-[#ba1a1a] font-mono text-xs">No se pudo cargar la lista de usuarios. Intenta de nuevo.</p>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filteredUsers.length === 0 && (
                <tr>
                  <td className="py-8 text-center text-[#557b7f] font-mono text-xs" colSpan={4}>
                    {hasFilters ? 'No se encontraron usuarios con los filtros aplicados.' : 'No hay usuarios registrados.'}
                  </td>
                </tr>
              )}
              {pageUsers.map((user) => {
                const initials = getInitials(user.fullName)
                const avatarStyle = getUserAvatarStyle(user.role)
                // Sin identidad de sesión no se ofrece desactivar a nadie; nunca a la propia sesión.
                // Un usuario ya inactivo tampoco se desactiva de nuevo.
                const canDeactivate = user.active && me !== undefined && me.id !== user.id
                return (
                  <tr key={user.id} className="hover:bg-[#f7fcfc] transition-colors">
                    <td className="py-3.5 px-4 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          aria-hidden="true"
                          className={`w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 border ${avatarStyle.bg} ${avatarStyle.text} ${avatarStyle.border}`}
                        >
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[#004b4e] leading-tight truncate text-sm font-sans">{user.fullName}</span>
                          <span className="font-mono text-[11px] text-[#557b7f] truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${getRoleBadgeStyle(user.role)}`}>
                        <span aria-hidden="true" className="material-symbols-outlined text-xs">{roleIcons[user.role]}</span>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          user.active
                            ? 'bg-[#e8f7f9] text-[#006b5f] border border-[#cce7ea]'
                            : 'bg-[#f0fafb] text-[#557b7f] border border-[#cce7ea]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-[#14b8a6] animate-pulse' : 'bg-[#8ba7ab]'}`}
                        />
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 font-mono">
                        <button
                          aria-label={`Editar usuario ${user.fullName}`}
                          className={`p-1.5 rounded text-[#004b4e] hover:bg-[#e8f7f9] border border-transparent hover:border-[#cce7ea] transition-colors cursor-pointer touch-manipulation ${focusRing}`}
                          onClick={() => { setEditing(user) }}
                          title="Editar"
                          type="button"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-base">edit</span>
                        </button>
                        {canDeactivate && (
                          <button
                            aria-label={`Desactivar usuario ${user.fullName}`}
                            className={`p-1.5 rounded text-[#ba1a1a] hover:bg-[#ffdad6]/50 border border-transparent hover:border-[#ba1a1a]/40 transition-colors cursor-pointer touch-manipulation ${focusRing}`}
                            onClick={() => { setDeactivating(user) }}
                            title="Desactivar"
                            type="button"
                          >
                            <span aria-hidden="true" className="material-symbols-outlined text-base">block</span>
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

        {filteredUsers.length > 0 && (
          <nav
            aria-label="Paginación de usuarios"
            className="px-4 py-3 bg-[#f7fcfc] border-t border-[#cce7ea] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#557b7f]"
          >
            <div className="flex items-center gap-2">
              <span className="tabular-nums">
                {`Mostrando ${String(pageStart + 1)}–${String(pageEnd)} de ${String(filteredUsers.length)}`}
              </span>
              <span>·</span>
              <span className="uppercase text-[11px]">PÁGINA {currentPage} DE {totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                aria-label="Página anterior"
                className={`px-2.5 py-1 rounded bg-white border border-[#cce7ea] text-[#557b7f] hover:bg-[#e8f7f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer font-mono font-semibold ${focusRing}`}
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
                  className={`min-w-8 px-2.5 py-1 rounded text-xs font-bold font-mono tabular-nums transition-colors cursor-pointer ${focusRing} ${
                    page === currentPage
                      ? 'bg-[#004b4e] text-white border border-[#004b4e]'
                      : 'bg-white hover:bg-[#e8f7f9] border border-[#cce7ea] text-[#004b4e]'
                  }`}
                  onClick={() => { setPage(page) }}
                  type="button"
                >
                  {page}
                </button>
              ))}
              <button
                aria-label="Siguiente página"
                className={`px-2.5 py-1 rounded bg-white border border-[#cce7ea] text-[#557b7f] hover:bg-[#e8f7f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer font-mono font-semibold ${focusRing}`}
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
