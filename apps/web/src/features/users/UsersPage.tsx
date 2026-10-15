import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useCurrentUser } from '@/features/auth/hooks'
import { roles, roleLabels, type Role, type User } from '@/features/auth/types'
import { getUsers, usersKey } from './api'
import { roleIcons } from './roleIcons'
import { CreateUserModal, DeactivateUserDialog, EditUserModal } from './UserModals'

const rolePlurals: Record<Role, string> = {
  ADMIN: 'Administradores',
  OPERATOR: 'Operadores',
  DRIVER: 'Repartidores',
  CUSTOMER: 'Clientes',
}

const hubs = [
  'Hub Central (Global)',
  'Micro-Hub Condesa',
  'Ruta 14 - Reforma',
  'Ruta 08 - Polanco',
  'Terminal Logística Guadalajara',
  'Centro Monterrey Industrial',
]

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
  const [search, setSearch] = useState('')
  const [hubFilter, setHubFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')
  const [showSuccess, setShowSuccess] = useState(false)

  const { data: me } = useCurrentUser()
  const { data: users = [], refetch, isLoading, isError } = useQuery({
    queryKey: usersKey,
    queryFn: getUsers,
  })

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      search === '' ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const adminCount = users.filter((u) => u.role === 'ADMIN').length
  const operatorCount = users.filter((u) => u.role === 'OPERATOR').length
  const driverCount = users.filter((u) => u.role === 'DRIVER').length

  const handleCreated = () => {
    setShowSuccess(true)
    setTimeout(() => { setShowSuccess(false); }, 2800)
  }

  return (
    <div className="flex flex-col gap-2 pt-2 pb-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-on-surface tracking-tight">Gestión de Usuarios</h1>
            <span className="font-label-badge uppercase tracking-wider text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full font-bold text-[9px]">
              Directorio Activo
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-tight">
            Administra credenciales, accesos operativos y asignación de hubs.
          </p>
        </div>
        <button
          className="flex items-center gap-1 bg-primary hover:bg-on-primary-fixed-variant text-on-primary px-2.5 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer text-[11px] font-semibold self-start lg:self-auto"
          onClick={() => { setIsCreating(true); }}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-sm">person_add</span>
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Total Cuentas */}
        <div className="bg-surface-container-lowest p-2.5 rounded-xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between pb-1">
            <span className="font-label-badge text-on-surface-variant uppercase font-bold tracking-wider text-[9px]">Total Cuentas</span>
            <div className="w-7 h-7 rounded-lg bg-primary-fixed/50 group-hover:bg-primary-fixed text-primary flex items-center justify-center transition-colors flex-shrink-0">
              <span aria-hidden="true" className="material-symbols-outlined text-sm">shield_person</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-0.5 gap-1">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-lg font-bold text-on-surface">{users.length}</span>
              <span className="text-[10px] text-on-surface-variant truncate">usuarios</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-secondary-container/50 text-secondary font-bold whitespace-nowrap flex-shrink-0 text-[9px]">
              <span aria-hidden="true" className="material-symbols-outlined text-[9px]">trending_up</span> +3
            </span>
          </div>
        </div>

        {/* Administradores */}
        <div className="bg-surface-container-lowest p-2.5 rounded-xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between pb-1">
            <span className="font-label-badge text-on-surface-variant uppercase font-bold tracking-wider text-[9px]">Admins</span>
            <div className="w-7 h-7 rounded-lg bg-primary-container/20 group-hover:bg-primary-container/30 text-primary flex items-center justify-center transition-colors flex-shrink-0">
              <span aria-hidden="true" className="material-symbols-outlined text-sm">admin_panel_settings</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-0.5 gap-1">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-lg font-bold text-on-surface">{adminCount}</span>
              <span className="text-[10px] text-on-surface-variant truncate">roles</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface-container-high text-primary font-bold whitespace-nowrap flex-shrink-0 text-[9px]">
              <span aria-hidden="true" className="material-symbols-outlined text-[9px]">verified_user</span> Root
            </span>
          </div>
        </div>

        {/* Operadores Hub */}
        <div className="bg-surface-container-lowest p-2.5 rounded-xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between pb-1">
            <span className="font-label-badge text-on-surface-variant uppercase font-bold tracking-wider text-[9px]">Operadores</span>
            <div className="w-7 h-7 rounded-lg bg-surface-variant group-hover:bg-surface-container-highest text-primary flex items-center justify-center transition-colors flex-shrink-0">
              <span aria-hidden="true" className="material-symbols-outlined text-sm">tune</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-0.5 gap-1">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-lg font-bold text-on-surface">{operatorCount}</span>
              <span className="text-[10px] text-on-surface-variant truncate">centros</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-bold whitespace-nowrap flex-shrink-0 text-[9px]">
              <span className="w-1 h-1 rounded-full bg-secondary animate-pulse" /> 9 turno
            </span>
          </div>
        </div>

        {/* Repartidores Activos */}
        <div className="bg-surface-container-lowest p-2.5 rounded-xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between pb-1">
            <span className="font-label-badge text-on-surface-variant uppercase font-bold tracking-wider text-[9px]">Repartidores</span>
            <div className="w-7 h-7 rounded-lg bg-secondary-container/40 group-hover:bg-secondary-container/60 text-secondary flex items-center justify-center transition-colors flex-shrink-0">
              <span aria-hidden="true" className="material-symbols-outlined text-sm">two_wheeler</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-0.5 gap-1">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-lg font-bold text-on-surface">{driverCount}</span>
              <span className="text-[10px] text-on-surface-variant truncate">en ruta</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary-fixed/70 text-primary font-bold whitespace-nowrap flex-shrink-0 text-[9px]">
              <span aria-hidden="true" className="material-symbols-outlined text-[9px]">radar</span> 94%
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 p-3 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Search & Hub Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 w-full min-w-0 flex items-center">
            <span aria-hidden="true" className="material-symbols-outlined absolute left-3 text-primary text-base pointer-events-none">search</span>
            <input
              className="w-full bg-surface-container-low/70 text-on-surface text-xs pl-9 pr-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline-none"
              placeholder="Buscar por nombre o correo..."
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
            />
          </div>
          <div className="relative w-full sm:w-40 flex items-center flex-shrink-0">
            <span aria-hidden="true" className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-base pointer-events-none">warehouse</span>
            <select
              className="w-full bg-surface-container-low/70 text-on-surface text-xs pl-8 pr-7 py-2 rounded-lg border-0 focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all appearance-none outline-none cursor-pointer font-medium"
              value={hubFilter}
              onChange={(e) => { setHubFilter(e.target.value); }}
            >
              <option value="">Todos los Centros</option>
              {hubs.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span aria-hidden="true" className="material-symbols-outlined absolute right-2 text-outline pointer-events-none text-sm">expand_more</span>
          </div>
        </div>

        {/* Role Pills & Actions */}
        <div className="flex flex-wrap items-center justify-between xl:justify-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-surface-container-low/60 p-0.5 rounded-lg">
            <button
              className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${roleFilter === 'ALL' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              onClick={() => { setRoleFilter('ALL'); }}
            >
              Todos ({users.length})
            </button>
            {roles.map((r) => (
              <button
                key={r}
                className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${roleFilter === r ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                onClick={() => { setRoleFilter(r); }}
              >
                {rolePlurals[r]}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-surface-container-high hidden sm:block" />
          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-semibold border border-surface-container-high"
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-base">download</span>
              <span className="hidden md:inline">Exportar</span>
            </button>
            <button
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors border border-surface-container-high"
              type="button"
              onClick={() => void refetch()}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 overflow-hidden">
        {/* Table Header */}
        <div className="px-4 py-2.5 flex items-center justify-between bg-surface-container-low/40 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-on-surface">Directorio General de Personal</h2>
            <span className={`font-label-code bg-surface-container-high text-primary px-2 py-0.5 rounded-md font-bold transition-all text-[10px] ${showSuccess ? 'bg-secondary-container text-on-secondary-container' : ''}`}>
              {showSuccess ? '¡Usuario creado con éxito!' : `${String(filteredUsers.length)} registros activos`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-on-surface-variant hidden sm:inline">Sincronizado con Hub Pikka en tiempo real</span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-surface-container/60 text-on-surface-variant font-label-badge uppercase tracking-wider border-b border-surface-container">
                <th className="py-2 px-3 font-bold text-[10px]">Usuario / Credenciales</th>
                <th className="py-2 px-2 font-bold text-[10px]">Rol Logístico</th>
                <th className="py-2 px-2 font-bold text-[10px]">Centro / Hub</th>
                <th className="py-2 px-2 font-bold text-[10px]">Estado</th>
                <th className="py-2 px-2 font-bold text-[10px] hidden xl:table-cell">Última Actividad</th>
                <th className="py-2 px-3 text-right font-bold text-[10px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low text-xs">
              {isLoading && (
                <tr>
                  <td className="py-6 text-center text-on-surface-variant" colSpan={6}>Cargando...</td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td className="py-6 text-center" colSpan={6}>
                    <p role="alert" className="text-error">No se pudo cargar la lista de usuarios. Intenta de nuevo.</p>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filteredUsers.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-on-surface-variant" colSpan={6}>
                    {search || hubFilter || roleFilter !== 'ALL'
                      ? 'No se encontraron usuarios con los filtros aplicados.'
                      : 'No hay usuarios registrados.'}
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => {
                const initials = getInitials(user.fullName)
                const badgeClass = getRoleBadgeClass(user.role)
                // Sin identidad de sesión no se ofrece desactivar a nadie; nunca a la propia sesión.
                const canDeactivate = user.active && me !== undefined && me.id !== user.id
                return (
                  <tr key={user.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] font-label-code shadow-sm flex-shrink-0 ${badgeClass}`}>
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
                      <div className="flex items-center gap-1 text-on-surface font-medium">
                        <span aria-hidden="true" className="material-symbols-outlined text-sm text-primary flex-shrink-0">hub</span>
                        <span className="truncate text-[10px]">Hub Central</span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      {user.active ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-secondary-container/40 text-secondary whitespace-nowrap">
                          <span className="w-1 h-1 rounded-full bg-secondary" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-surface-container-high text-on-surface-variant whitespace-nowrap">
                          <span className="w-1 h-1 rounded-full bg-outline" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-[10px] text-on-surface-variant hidden xl:table-cell">
                      <div className="flex items-center gap-1">
                        <span aria-hidden="true" className="material-symbols-outlined text-xs text-outline">schedule</span>
                        <span>—</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          aria-label={`Editar a ${user.fullName}`}
                          className="p-0.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                          onClick={() => { setEditing(user); }}
                          title="Editar"
                          type="button"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        {canDeactivate && (
                          <button
                            aria-label={`Desactivar a ${user.fullName}`}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-error hover:bg-error-container/40 transition-colors"
                            onClick={() => { setDeactivating(user); }}
                            type="button"
                          >
                            <span aria-hidden="true" className="material-symbols-outlined text-xs">block</span>
                            Desactivar
                          </button>
                        )}
                        <button className="p-0.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors" title="Más opciones" type="button">
                          <span aria-hidden="true" className="material-symbols-outlined text-sm">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-2.5 bg-surface-container-low/30 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-2 text-on-surface-variant text-[10px]">
          <div className="flex items-center gap-2">
            <span>Mostrando <span className="font-bold text-on-surface">1 - {filteredUsers.length}</span> de {users.length} registros</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-surface-container border border-surface-container-high disabled:opacity-30 cursor-not-allowed" disabled>
              <span aria-hidden="true" className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="px-2 py-0.5 bg-primary text-on-primary rounded font-bold text-[10px] shadow-xs">1</span>
            <button className="px-2 py-0.5 hover:bg-surface-container rounded cursor-pointer text-[10px] font-semibold text-on-surface">2</button>
            <button className="px-2 py-0.5 hover:bg-surface-container rounded cursor-pointer text-[10px] font-semibold text-on-surface">3</button>
            <button className="p-1 rounded hover:bg-surface-container border border-surface-container-high cursor-pointer text-on-surface-variant">
              <span aria-hidden="true" className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-surface-container-low/70 border border-surface-container-high/60 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              alt="Pikka Mascot"
              className="w-6 h-6 object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1U5476N65UG5b8LIbeNyDiuL6dGo2gG2HEOhVi9vj2tUpaaCovo_E6gEzkEt6u04W6yfTBUl47aKPbH1tGrq1r2wtsHp6XzyCnnibHcbcLK0AqYzFDsh7xKYhzAUuxUcVjX-GuUygXythMCzrSlU4i_JlUmWymebVv6GNZEvTGg9L-EG32qvvVNaY-mcyPg1YSXfE_y5bwB26nBdZg8tXdF9Tl5TcTQXhzWKhpZ6r11Rr5aNHfMngsi1EeQTHLzR_jcR6IIARwnEQ"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-primary">Protocolo de seguridad Pikka & Doble Factor (2FA)</span>
            <span className="text-[10px] text-on-surface-variant">Cada nuevo integrante recibe por SMS o correo su enlace cifrado para validación biométrica y cambio de contraseña.</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] uppercase font-bold text-secondary bg-secondary-container/30 px-2.5 py-0.5 rounded-full">Políticas Activas 2025</span>
        </div>
      </div>

      {/* Modales */}
      {isCreating && (
        <CreateUserModal
          onClose={() => { setIsCreating(false); }}
          onCreated={handleCreated}
        />
      )}
      {editing && (
        <EditUserModal
          key={editing.id}
          onClose={() => { setEditing(null); }}
          user={editing}
        />
      )}
      {deactivating && (
        <DeactivateUserDialog
          onClose={() => { setDeactivating(null); }}
          user={deactivating}
        />
      )}
    </div>
  )
}
