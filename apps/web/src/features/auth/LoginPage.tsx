import { useState, type SyntheticEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import {
  Bike,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  QrCode,
  Fingerprint,
  KeyRound,
  ArrowRight,
  Headphones,
  Zap,
  HeartHandshake,
  PackageCheck,
  Sparkles,
  Lock as LockIcon,
  LayoutDashboard,
} from 'lucide-react'
import { userMessage } from '@/shared/api/errors'
import { useLogin } from './hooks'
import { useSession } from './session-store'

const ROLES = [
  { id: 'dispatch', label: 'Despacho', icon: LayoutDashboard },
  { id: 'driver', label: 'Repartidor', icon: Bike },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
] as const

type Role = typeof ROLES[number]['id']

export function LoginPage() {
  const token = useSession((s) => s.token)
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLogin()
  const [role, setRole] = useState<Role>('dispatch')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const state: unknown = location.state
  const from = redirectTarget(state)

  if (token) return <Navigate to={from} replace />

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    loginMutation.mutate(
      { email: email.trim(), password },
      { onSuccess: () => void navigate(from, { replace: true }) },
    )
  }

  const handleQuickAccess = (_action: string) => {
    // Placeholder - no backend logic implemented
  }

  const isLoading = loginMutation.isPending
  const isDisabled = isLoading || !email || !password

  return (
    <div className="login-split-container">
      <main className="login-main">
        {/* LEFT PANEL - Dark Teal Form */}
        <section className="login-left panel-inner-glow">
          {/* Ambient light decorative backdrops */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-pikka-cyan/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -right-20 w-80 h-80 rounded-full bg-pikka-teal/20 blur-3xl pointer-events-none" />

          {/* Top Section: Brand Identity & Portal Pill */}
          <header className="relative z-10 flex items-center justify-between shrink-0">
            {/* Logo Pikka */}
            <div className="flex items-center gap-2">
              <div className="flex items-baseline tracking-tight font-brand font-extrabold text-2xl sm:text-3xl text-white select-none">
                <span className="text-white">p</span>
                <span className="relative inline-block text-white">
                  i
                  <span className="absolute -top-[0.28em] left-1/2 -translate-x-1/2 w-[0.26em] h-[0.26em] rounded-full bg-[#2dd4bf] shadow-sm shadow-[#2dd4bf]/80" />
                </span>
                <span className="text-white">kka</span>
              </div>
              <span className="w-px h-5 bg-[#1a5457] mx-1" />
              <span className="text-[10px] tracking-wider uppercase font-semibold text-[#d4f2ee]/80 bg-[#0e7075]/30 px-2 py-0.5 rounded-full border border-[#1bb3b8]/20">
                Dispatch Hub
              </span>
            </div>

            {/* Security status indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-300/90 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-[10px] tracking-wide">Red Operativa</span>
            </div>
          </header>

          {/* Center Section: Welcome & Form Content */}
          <div className="relative z-10 my-auto py-3">
            {/* Welcome Headings */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#1bb3b8] font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Acceso Corporativo Seguro
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-brand leading-tight">
                ¡Bienvenido de nuevo!
              </h1>
              <p className="text-slate-300/80 text-xs mt-1 leading-snug">
                Ingresa a tu cuenta para sincronizar entregas, flota y rutas activas.
              </p>
            </div>

            {/* Role Selector Switcher */}
            <div className="mb-4 p-1 bg-black/25 backdrop-blur-md rounded-xl border border-[#1a5457]/60 grid grid-cols-3 gap-1">
              {ROLES.map((r) => {
                const Icon = r.icon
                const isSelected = role === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`role-btn py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'text-white bg-[#0e7075] shadow-md border border-[#1bb3b8]/40'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{r.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Authentication Form */}
            <form className="space-y-3" onSubmit={onSubmit}>
              {/* Email Input */}
              <div className="space-y-1">
                <label
                  className="block text-[10px] font-bold text-slate-200 uppercase tracking-wider"
                  htmlFor="corporate-email"
                >
                  Correo corporativo / ID Conductor
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-[#1bb3b8]" />
                  </div>
                  <input
                    id="corporate-email"
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-[#072427]/90 border border-[#1a5457] hover:border-[#1bb3b8]/60 focus:border-[#1bb3b8] text-white text-xs rounded-lg pl-9 pr-3 py-2.5 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-[#1bb3b8]/30 shadow-inner"
                    placeholder="operaciones@pikka.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    className="block text-[10px] font-bold text-slate-200 uppercase tracking-wider"
                    htmlFor="corporate-password"
                  >
                    Contraseña
                  </label>
                  <a
                    href="#"
                    className="text-[10px] text-[#1bb3b8] hover:text-white transition-colors duration-150 font-medium hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-[#1bb3b8]" />
                  </div>
                  <input
                    id="corporate-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-[#072427]/90 border border-[#1a5457] hover:border-[#1bb3b8]/60 focus:border-[#1bb3b8] text-white text-xs rounded-lg pl-9 pr-10 py-2.5 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-[#1bb3b8]/30 shadow-inner"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Options: Remember Me & Security Mode */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-3.5 h-3.5 rounded border-[#1a5457] bg-[#072427] text-[#1bb3b8] focus:ring-[#1bb3b8]/40 focus:ring-offset-0 focus:ring-1 transition cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-300 group-hover:text-white transition-colors">
                    Mantener sesión abierta (8 hrs)
                  </span>
                </label>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <KeyRound className="w-2.5 h-2.5 text-[#1bb3b8]/80" />
                  MFA Activo
                </span>
              </div>

              {/* Error Alert */}
              {loginMutation.isError && (
                <div
                  role="alert"
                  className="bg-red-500/10 border border-red-500/50 rounded-lg p-2.5 text-red-400 text-xs"
                >
                  {userMessage(loginMutation.error)}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isDisabled}
                className="w-full py-3 px-5 rounded-lg font-bold text-xs tracking-wide bg-gradient-to-r from-[#1bb3b8] via-[#13a2a7] to-[#0e7075] hover:from-[#21c2c8] hover:to-[#0f8288] text-slate-950 shadow-lg shadow-[#1bb3b8]/25 hover:shadow-[#1bb3b8]/40 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2 group"
              >
                <span>{isLoading ? 'Ingresando…' : 'Iniciar Sesión en Pikka'}</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Alternative Quick Access Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#1a5457]/60" />
                <span className="flex-shrink mx-2 text-[10px] uppercase tracking-wider text-slate-400">
                  o ingresa con
                </span>
                <div className="flex-grow border-t border-[#1a5457]/60" />
              </div>

              {/* Quick Access Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAccess('scan')}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#082b2e]/80 hover:bg-[#0c383c] border border-[#1a5457] hover:border-[#1bb3b8]/50 text-slate-200 text-[11px] font-semibold rounded-lg transition duration-150"
                >
                  <QrCode className="w-3 h-3 text-[#1bb3b8]" />
                  <span>Escanear Gafete</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAccess('token')}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#082b2e]/80 hover:bg-[#0c383c] border border-[#1a5457] hover:border-[#1bb3b8]/50 text-slate-200 text-[11px] font-semibold rounded-lg transition duration-150"
                >
                  <Fingerprint className="w-3 h-3 text-[#1bb3b8]" />
                  <span>Pikka Token ID</span>
                </button>
              </div>
            </form>
          </div>

          {/* Footer Section: Compliance & Support */}
          <footer className="relative z-10 pt-2 border-t border-[#1a5457]/60 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 shrink-0">
            <div className="flex items-center gap-1">
              <LockIcon className="w-2.5 h-2.5 text-[#1bb3b8]" />
              <span>Cifrado TLS 256-bit v1.3</span>
            </div>
            <div className="flex items-center gap-2">
              <a href="#" className="hover:text-slate-200 transition-colors">
                Términos
              </a>
              <span>•</span>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Privacidad
              </a>
              <span>•</span>
              <a href="#" className="text-[#1bb3b8] hover:underline flex items-center gap-1">
                <Headphones className="w-2.5 h-2.5" />
                Soporte 24/7
              </a>
            </div>
          </footer>
        </section>

        {/* RIGHT PANEL - White with Branding */}
        <section className="login-right">
          {/* Top Header Badges */}
          <header className="relative z-20 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-teal-100 shadow-sm min-w-0">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-[#082f32] tracking-tight truncate">
                Centro de Distribución #04
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-white/70 backdrop-blur px-2.5 py-1.5 rounded-full border border-teal-100 text-[11px] font-medium text-slate-600 shrink-0">
              <PackageCheck className="w-3 h-3 text-[#0e7075]" />
              <span>99.8% a tiempo</span>
            </div>
          </header>

          {/* Center Mascot Stage */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0 my-2">
            {/* Glowing Decorative rings */}
            <div className="absolute w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-[#d4f2ee]/80 to-cyan-100/40 blur-2xl -z-10 pointer-events-none" />
            <div className="absolute w-[280px] h-[280px] rounded-full border border-teal-200/50 -z-10 pointer-events-none animate-pulse-subtle" />

            {/* Floating Info Pill: High Velocity (top-left) */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-6 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg shadow-teal-900/5 border border-white flex items-center gap-2 transform -rotate-3 hover:rotate-0 transition-transform duration-300 hidden sm:flex z-20">
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-[#1bb3b8]" style={{ fill: 'rgba(27, 179, 184, 0.3)' }} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
                  Despacho Express
                </p>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Menos de 35 min</p>
              </div>
            </div>

            {/* Floating Info Pill: Customer Satisfaction (top-right) */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-6 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg shadow-teal-900/5 border border-white flex items-center gap-2 transform rotate-2 hover:rotate-0 transition-transform duration-300 hidden sm:flex z-20">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
                  Satisfacción
                </p>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">4.9 / 5 estrellas</p>
              </div>
            </div>

            {/* Hero Mascot */}
            <div className="relative group max-w-[320px] w-full flex flex-col items-center justify-center">
              <div className="relative animate-float-slow filter drop-shadow-2xl">
                <img
                  src="/src/assets/pikka.png"
                  alt="Pikka Nutria Mensajera con paquete y mochila"
                  className="w-full max-h-[240px] sm:max-h-[280px] object-contain select-none transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {/* Isometric floor shadow ellipse */}
              <div className="w-48 sm:w-56 h-6 bg-teal-900/15 rounded-[100%] blur-md mt-[-12px] -z-10" />
            </div>

            {/* Value Proposition Badge */}
            <div className="mt-3 text-center max-w-sm shrink-0">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-teal-900/5 text-[#0e7075] border border-teal-200/60 mb-1.5">
                <Sparkles className="w-3 h-3 text-[#1bb3b8]" />
                <span>Logística Inteligente de Última Milla</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#082f32] font-brand tracking-tight leading-tight">
                Tus pedidos, en buenas manos
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 leading-snug">
                Monitoreo en tiempo real, trazabilidad punto a punto y entregas con calidez para cada cliente.
              </p>
            </div>
          </div>

          {/* Bottom Brand Values Footer */}
          <footer className="relative z-10 pt-2 border-t border-teal-200/60 flex items-center justify-center sm:justify-between gap-2 text-[11px] text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#082f32] shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#0e7075] shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1bb3b8] shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4f2ee] shrink-0" />
              <span className="text-[10px] font-medium text-slate-400 pl-1 truncate">Identidad Oficial Pikka</span>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase text-[#0e7075]/80 shrink-0">
              <span>Moderno</span>
              <span className="text-slate-300">/</span>
              <span>Amigable</span>
              <span className="text-slate-300">/</span>
              <span>Memorable</span>
            </div>
          </footer>
        </section>
      </main>
    </div>
  )
}

/** Ruta a la que volver tras el login, guardada por RequireAuth. Solo rutas internas. */
function redirectTarget(state: unknown): string {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'string' &&
    state.from.startsWith('/')
  ) {
    return state.from
  }
  return '/'
}
