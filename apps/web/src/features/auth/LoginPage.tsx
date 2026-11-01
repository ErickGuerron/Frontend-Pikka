import { useState, type SyntheticEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  Headphones,
  Zap,
  HeartHandshake,
  PackageCheck,
  Sparkles,
  Lock as LockIcon,
} from 'lucide-react'
import { loginErrorMessage } from './login-error'
import pikkaMascot from '@/assets/pikka.png'
import { Brand } from '@/features/landing/Brand'
import { useLogin } from './hooks'
import { SignupForm } from './SignupForm'
import { useSession } from './session-store'

export function LoginPage() {
  const token = useSession((s) => s.token)
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>(
    () => (new URLSearchParams(location.search).get('modo') === 'registro' ? 'signup' : 'login'),
  )

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

  // Placeholder - no backend logic implemented

  const isLoading = loginMutation.isPending
  const isDisabled = isLoading || !email || !password

  return (
    <div className="login-split-container">
      <main className="login-main">
        {/* LEFT PANEL - Dark Teal Form */}
        <section className="login-left panel-inner-glow">
          {/* Ambient light decorative backdrops */}
          <div className="absolute -top-24 -left-24 hidden lg:block w-80 h-80 rounded-full bg-pikka-cyan/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -right-20 hidden lg:block w-80 h-80 rounded-full bg-pikka-teal/20 blur-3xl pointer-events-none" />

          {/* Top Section: Brand Identity & Portal Pill */}
          <header className="relative z-10 hidden lg:flex items-center justify-between shrink-0">
            {/* Logo Pikka */}
            <div className="flex items-center gap-2">
              <Brand variant="white" textSize="text-2xl sm:text-3xl" />
              <span className="w-px h-5 bg-[#14b8a6]/30 mx-1" />
              <span className="text-[10px] tracking-wider uppercase font-mono font-semibold text-[#a5eff2] bg-[#14b8a6]/15 px-2.5 py-0.5 rounded border border-[#14b8a6]/25">
                Dispatch Hub
              </span>
            </div>

            {/* Security status indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#2dd4bf] bg-[#14b8a6]/15 border border-[#14b8a6]/30 px-2.5 py-1 rounded font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse" />
              <span className="font-medium tracking-wide">Red Operativa</span>
            </div>
          </header>

          {/* Mobile brand hero (hidden from lg, where the dark panel header and white visual panel take over) */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <div className="relative w-36 h-36 rounded-full bg-[#e8f7f9] border border-[#cce7ea] shadow-sm flex items-center justify-center">
              <img
                src={pikkaMascot}
                alt="Pikka, la nutria mensajera"
                className="relative w-28 object-contain select-none"
              />
              <span className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#004b4e] text-white flex items-center justify-center shadow-sm">
                <Zap className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#004b4e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6] motion-safe:animate-pulse" />
              Entregas en tiempo real
            </span>
            <div className="mt-2">
              <Brand variant="deep" textSize="text-[28px]" showIsotipo={false} />
            </div>
            <p className="text-xs text-[#557b7f]">Logística de última milla, con calidez.</p>
          </div>

          {/* Center Section: Welcome & Form Content */}
          <div className="relative z-10 auth-card">
            {/* Welcome Headings */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest text-[#004b4e] lg:text-[#2dd4bf] font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Acceso Corporativo Seguro
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#061f23] lg:text-white font-sans leading-tight">
                {mode === 'login' ? '¡Bienvenido de nuevo!' : 'Crea tu cuenta'}
              </h1>
              <p className="auth-muted text-xs mt-1 leading-snug">
                {mode === 'login'
                  ? 'Ingresa a tu cuenta para sincronizar entregas, flota y rutas activas.'
                  : 'Regístrate como cliente para solicitar y seguir tus pedidos.'}
              </p>
            </div>

            {mode === 'signup' ? (
              <SignupForm onSuccess={() => void navigate(from, { replace: true })} />
            ) : (
              <>
            {/* Authentication Form */}
            <form className="space-y-3" onSubmit={onSubmit}>
              {/* Email Input */}
              <div className="space-y-1">
                <label
                  className="auth-label"
                  htmlFor="corporate-email"
                >
                  Correo corporativo / ID Conductor
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 lg:pl-3 flex items-center pointer-events-none">
                    <Mail className="auth-icon" />
                  </div>
                  <input
                    id="corporate-email"
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); }}
                    disabled={isLoading}
                    className="auth-input"
                    placeholder="operaciones@pikka.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    className="auth-label"
                    htmlFor="corporate-password"
                  >
                    Contraseña
                  </label>
                  <a
                    href="#"
                    className="text-[10px] auth-link font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 lg:pl-3 flex items-center pointer-events-none">
                    <Lock className="auth-icon" />
                  </div>
                  <input
                    id="corporate-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); }}
                    disabled={isLoading}
                    className="auth-input pr-10"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowPassword(!showPassword); }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center auth-muted hover:opacity-70 transition-colors"
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
                    className="w-3.5 h-3.5 rounded accent-primary lg:accent-[#1bb3b8] cursor-pointer"
                  />
                  <span className="text-[11px] auth-muted">
                    Mantener sesión abierta (8 hrs)
                  </span>
                </label>
                <span className="text-[10px] auth-muted flex items-center gap-1">
                  <KeyRound className="w-2.5 h-2.5 auth-icon" />
                  MFA Activo
                </span>
              </div>

              {/* Error Alert */}
              {loginMutation.isError && (
                <div
                  role="alert"
                  className="auth-alert"
                >
                  {loginErrorMessage(loginMutation.error)}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isDisabled}
                className="auth-submit group"
              >
                <span>{isLoading ? 'Ingresando…' : 'Iniciar Sesión en Pikka'}</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
              </>
            )}

            {/* Login / sign-up toggle */}
            <p className="mt-3 text-center text-[11px] auth-muted">
              {mode === 'login' ? '¿Eres cliente nuevo?' : '¿Ya tienes cuenta?'}{' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login') }}
                className="auth-link"
              >
                {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </p>
          </div>

          {/* Footer Section: Compliance & Support */}
          <footer className="relative z-10 pt-2 border-t auth-divider flex flex-wrap items-center justify-between gap-1 text-[10px] auth-muted shrink-0">
            <div className="flex items-center gap-1">
              <LockIcon className="w-2.5 h-2.5 auth-icon" />
              <span>Cifrado TLS 256-bit v1.3</span>
            </div>
            <div className="flex items-center gap-2">
              <a href="#" className="hover:underline transition-colors">
                Términos
              </a>
              <span>•</span>
              <a href="#" className="hover:underline transition-colors">
                Privacidad
              </a>
              <span>•</span>
              <a href="#" className="auth-link flex items-center gap-1">
                <Headphones className="w-2.5 h-2.5" />
                Soporte Pikka
              </a>
            </div>
          </footer>
        </section>

        {/* RIGHT PANEL - White with Branding */}
        <section className="login-right">
          {/* Top Header Badges */}
          <header className="relative z-20 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-[#f0fafb] px-3 py-1.5 rounded-full border border-[#cce7ea] shadow-sm min-w-0">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14b8a6] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14b8a6]" />
              </span>
              <span className="text-[11px] font-mono font-bold text-[#004b4e] tracking-tight truncate">
                Centro de Distribución #04
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-[#f0fafb] px-2.5 py-1.5 rounded-full border border-[#cce7ea] text-[11px] font-mono text-[#557b7f] shrink-0">
              <PackageCheck className="w-3.5 h-3.5 text-[#004b4e]" />
              <span>99.8% a tiempo</span>
            </div>
          </header>

          {/* Center Mascot Stage */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0 my-2">
            {/* Glowing Decorative rings */}
            <div className="absolute w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-[#e8f7f9] to-[#cce7ea]/50 blur-2xl -z-10 pointer-events-none" />
            <div className="absolute w-[280px] h-[280px] rounded-full border border-[#14b8a6]/25 -z-10 pointer-events-none animate-pulse-subtle" />

            {/* Floating Info Pill: High Velocity (top-left) */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-6 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm border border-[#cce7ea] flex items-center gap-2 transform -rotate-3 hover:rotate-0 transition-transform duration-300 hidden sm:flex z-20">
              <div className="w-7 h-7 rounded-lg bg-[#e8f7f9] flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-[#14b8a6]" />
              </div>
              <div>
                <p className="text-[9px] font-mono font-bold text-[#557b7f] uppercase tracking-wider leading-tight">
                  Despacho Express
                </p>
                <p className="text-[11px] font-bold text-[#004b4e] leading-tight font-mono">Menos de 35 min</p>
              </div>
            </div>

            {/* Floating Info Pill: Customer Satisfaction (top-right) */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-6 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm border border-[#cce7ea] flex items-center gap-2 transform rotate-2 hover:rotate-0 transition-transform duration-300 hidden sm:flex z-20">
              <div className="w-7 h-7 rounded-lg bg-[#e8f7f9] flex items-center justify-center shrink-0">
                <HeartHandshake className="w-4 h-4 text-[#006b5f]" />
              </div>
              <div>
                <p className="text-[9px] font-mono font-bold text-[#557b7f] uppercase tracking-wider leading-tight">
                  Satisfacción
                </p>
                <p className="text-[11px] font-bold text-[#004b4e] leading-tight font-mono">4.9 / 5 estrellas</p>
              </div>
            </div>

            {/* Hero Mascot */}
            <div className="relative group max-w-[320px] w-full flex flex-col items-center justify-center">
              <div className="relative animate-float-slow filter drop-shadow-xl">
                <img
                  src={pikkaMascot}
                  alt="Pikka Nutria Mensajera con paquete y mochila"
                  className="w-full max-h-[240px] sm:max-h-[280px] object-contain select-none transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {/* Isometric floor shadow ellipse */}
              <div className="w-48 sm:w-56 h-6 bg-[#004b4e]/15 rounded-[100%] blur-md mt-[-12px] -z-10" />
            </div>

            {/* Value Proposition Badge */}
            <div className="mt-3 text-center max-w-sm shrink-0">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#e8f7f9] text-[#004b4e] border border-[#cce7ea] mb-1.5">
                <Sparkles className="w-3 h-3 text-[#14b8a6]" />
                <span>Logística Inteligente de Última Milla</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#004b4e] font-sans tracking-tight leading-tight">
                Tus pedidos, en buenas manos
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[#557b7f] mt-0.5 leading-snug">
                Monitoreo en tiempo real, trazabilidad punto a punto y entregas con calidez para cada cliente.
              </p>
            </div>
          </div>

          {/* Bottom Brand Values Footer */}
          <footer className="relative z-10 pt-2 border-t border-[#cce7ea] flex items-center justify-center sm:justify-between gap-2 text-[11px] text-[#557b7f] shrink-0 font-mono">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#004b4e] shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#0a6568] shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6] shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#a5eff2] shrink-0" />
              <span className="text-[10px] font-medium text-[#557b7f] pl-1 truncate">Identidad Oficial Pikka</span>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase text-[#004b4e]/80 shrink-0">
              <span>Moderno</span>
              <span className="text-[#cce7ea]">/</span>
              <span>Amigable</span>
              <span className="text-[#cce7ea]">/</span>
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
