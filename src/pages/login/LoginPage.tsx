import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Fingerprint, Delete, ChevronLeft } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import api, { featureFlagsApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { SplashScreen } from '@/components/ui'
import { LiteModeBanner } from '@/components/ui/LiteModeBanner'
import OAuthButtons from '@/components/auth/OAuthButtons'
import {
  authenticateWebAuthn,
  registerWebAuthnPublic,
  checkWebAuthnSupport,
  WebAuthnError,
} from '@/lib/webauthn'
import type { UserRole } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSlowConnection } from '@/hooks/useSlowConnection'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PinStatusResponse {
  pinEnabled: boolean
  pinConfigured: boolean
}

interface TokenResponse {
  access_token: string
}

type Step = 'splash' | 'cedula' | 'loading' | 'webauthn-register' | 'pin' | 'pin-create' | 'need-activation'
type CreatePhase = 'new' | 'confirm'

// ── Helpers ───────────────────────────────────────────────────────────────────

function redirectByRole(role: UserRole, navigate: ReturnType<typeof useNavigate>) {
  if (role === 'SUPER_ADMIN') navigate('/super')
  else if (role === 'ADMIN') navigate('/admin')
  else navigate('/location-select')
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function PinDots({ count }: { count: number }) {
  const total = 6
  return (
    <div className="flex justify-center gap-4 my-3" role="img" aria-label={`${count} dígitos ingresados`}>
      {Array.from({ length: Math.max(4, count, total) }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`w-[18px] h-[18px] rounded-full transition-all duration-150 ${
            i < count
              ? 'bg-[var(--brand)] scale-110 shadow-[0_0_0_2px_var(--fg)]'
              : 'bg-transparent border-2 border-[color:var(--line-strong)]'
          }`}
        />
      ))}
    </div>
  )
}

function NumPad({
  onDigit,
  onBack,
  disabled,
}: {
  onDigit: (d: string) => void
  onBack: () => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-3" role="group" aria-label="Teclado numérico">
      {(['1','2','3','4','5','6','7','8','9','empty','0','⌫'] as const).map((key) => {
        if (key === 'empty') return <div key="empty" aria-hidden="true" />
        const isBack = key === '⌫'
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            aria-label={isBack ? 'Borrar' : key}
            onClick={() => isBack ? onBack() : onDigit(key)}
            className={`w-full h-[68px] rounded-[16px] font-display font-bold text-[34px] leading-none grid place-items-center active:scale-[0.95] transition-[transform,background-color] duration-100 disabled:opacity-40 ${
              isBack
                ? 'bg-transparent text-[var(--fg-muted)] hover:bg-[var(--wash)]'
                : 'bg-[var(--surface)] border-[1.5px] border-[color:var(--line-strong)] text-[var(--fg)] shadow-[var(--shadow-1)] active:bg-[var(--wash-brand)]'
            }`}
          >
            {isBack ? <Delete className="w-7 h-7" aria-hidden="true" /> : key}
          </button>
        )
      })}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function LoginPage() {
  usePageTitle('Iniciar sesión')

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const setToken = useAuthStore((s) => s.setToken)
  const toast    = useToast()

  // Fix C2: código de activación de primer acceso, entregado por el admin vía
  // un enlace /login?ci=<cedula>&code=<codigo>. Se guarda en sessionStorage y se
  // borra de la barra de direcciones para no dejarlo en el historial.
  const [activationCode, setActivationCode] = useState<string | null>(
    () => searchParams.get('code') || sessionStorage.getItem('activation_code'),
  )

  // Detecta error OAuth de vuelta desde OAuthCallbackPage
  const oauthError = (location.state as { oauthError?: string } | null)?.oauthError ?? null

  const [step,          setStep]          = useState<Step>('splash')
  const isSlow = useSlowConnection()
  const [showLiteBanner, setShowLiteBanner] = useState(false)
  const [cedula,        setCedula]        = useState('')
  const [pinDigits,     setPinDigits]     = useState<string[]>([])
  const [newDigits,     setNewDigits]     = useState<string[]>([])
  const [confirmDigits, setConfirmDigits] = useState<string[]>([])
  const [createPhase,   setCreatePhase]   = useState<CreatePhase>('new')
  const [registeringBiometric, setRegisteringBiometric] = useState(false)
  const [biometricFailed,      setBiometricFailed]      = useState(false)

  // Toggle para el panel de ingreso administradores
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  // Captura el código/cédula del enlace de activación una sola vez.
  useEffect(() => {
    const code = searchParams.get('code')
    const ci = searchParams.get('ci')
    if (code) {
      sessionStorage.setItem('activation_code', code)
      setActivationCode(code)
    }
    if (ci) setCedula(ci)
    if (code || ci) {
      window.history.replaceState({}, '', window.location.pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Feature flags para OAuth ─────────────────────────────────────────────────

  const { data: featureFlags, isLoading: flagsLoading } = useQuery({
    queryKey: QK.featureFlags(),
    queryFn: () => featureFlagsApi.getAll().then((r) => r.data),
    staleTime: 30_000,
    // Solo cargar cuando el usuario expande el panel admin
    enabled: showAdminLogin && step === 'cedula',
  })

  // ── Login con token ──────────────────────────────────────────────────────────

  function handleToken(access_token: string) {
    // El código de activación es de un solo uso; ya fue consumido en backend.
    sessionStorage.removeItem('activation_code')
    setToken(access_token)
    const user = useAuthStore.getState().user
    if (user?.role) redirectByRole(user.role, navigate)
  }

  // ── Mutaciones ───────────────────────────────────────────────────────────────

  const verifyPin = useMutation({
    mutationFn: (pin: string) =>
      api.post<TokenResponse>('/auth/pin/verify', {
        identification_number: cedula,
        pin,
      }),
    onSuccess: (res) => handleToken(res.data.access_token),
    onError:   () => { setPinDigits([]); toast.error('PIN incorrecto') },
  })

  const initPin = useMutation({
    mutationFn: (pin: string) =>
      api.post<TokenResponse>('/auth/pin/init', {
        identification_number: cedula,
        pin,
        activation_code: activationCode ?? '',
      }),
    onSuccess: (res) => handleToken(res.data.access_token),
    onError:   () =>
      toast.error(
        'No se pudo crear el PIN. Verifica tu código de activación o solicita uno nuevo a tu administrador.',
      ),
  })

  // ── Flujo principal: Continuar ────────────────────────────────────────────────

  async function handleContinuar(e: React.FormEvent) {
    e.preventDefault()
    if (!cedula.trim()) return
    setStep('loading')

    // 1. Verificar que el usuario existe
    let status: PinStatusResponse | null = null
    try {
      const res = await api.post<PinStatusResponse>('/auth/pin/status', {
        identification_number: cedula.trim(),
      })
      status = res.data
    } catch {
      toast.error('Cédula no encontrada')
      setStep('cedula')
      return
    }

    // 2. Si ya tiene PIN → ir directo al PIN (no intentar biometría)
    if (status.pinConfigured) {
      setStep('pin')
      return
    }

    // 3. Primer acceso (sin PIN): Fix C2 — requiere código de activación
    //    entregado por el administrador fuera de banda. Sin él no se permite
    //    ni registrar biométrico ni crear PIN.
    if (!activationCode) {
      setStep('need-activation')
      return
    }

    // 4. Con código: intentar WebAuthn si el dispositivo lo soporta
    const webAuthnAvailable = await checkWebAuthnSupport()

    if (webAuthnAvailable) {
      try {
        const token = await authenticateWebAuthn(cedula.trim())
        handleToken(token)
        return
      } catch (err) {
        if (err instanceof WebAuthnError && err.code === 'NO_CREDENTIALS') {
          // Sin credencial registrada → mostrar pantalla de registro biométrico
          setBiometricFailed(false)
          setStep('webauthn-register')
          return
        }
        // Canceló u otro error → crear PIN
      }
    }

    // 5. WebAuthn no disponible o cancelado → crear PIN
    setStep('pin-create')
    setCreatePhase('new')
  }

  // ── Registro biométrico ───────────────────────────────────────────────────────

  async function handleWebAuthnRegister() {
    if (!activationCode) {
      setStep('need-activation')
      return
    }
    setRegisteringBiometric(true)
    try {
      const token = await registerWebAuthnPublic(cedula.trim(), activationCode)
      setRegisteringBiometric(false)
      handleToken(token)
    } catch {
      setRegisteringBiometric(false)
      setBiometricFailed(true)
    }
  }

  // ── PIN existente ─────────────────────────────────────────────────────────────

  function handlePinDigit(d: string) {
    setPinDigits((prev) => (prev.length < 8 ? [...prev, d] : prev))
  }

  function handlePinSubmit() {
    if (pinDigits.length < 4) return
    verifyPin.mutate(pinDigits.join(''))
  }

  // ── Crear PIN nuevo ───────────────────────────────────────────────────────────

  function handleCreateDigit(d: string) {
    if (createPhase === 'new') {
      setNewDigits((p) => p.length < 8 ? [...p, d] : p)
    } else {
      setConfirmDigits((p) => p.length < 8 ? [...p, d] : p)
    }
  }

  function handleCreateBack() {
    if (createPhase === 'new') {
      setNewDigits((p) => p.slice(0, -1))
    } else {
      setConfirmDigits((p) => p.slice(0, -1))
    }
  }

  function handleCreateNext() {
    if (createPhase === 'new') {
      if (newDigits.length < 4) return
      setCreatePhase('confirm')
      setConfirmDigits([])
    } else {
      if (confirmDigits.length < 4) return
      if (newDigits.join('') !== confirmDigits.join('')) {
        toast.error('Los PINs no coinciden. Intenta de nuevo.')
        setNewDigits([])
        setConfirmDigits([])
        setCreatePhase('new')
        return
      }
      initPin.mutate(newDigits.join(''))
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-[var(--bg)] flex flex-col items-center justify-center px-6 pt-8 overflow-auto">

      <SplashScreen onDone={() => { setStep('cedula'); setShowLiteBanner(isSlow && !sessionStorage.getItem('lite_banner_dismissed')) }} />

      <div className="hazard fixed inset-x-0 top-0 h-3 z-10" aria-hidden="true" />

      {/* Marca */}
      <div className="relative z-10 mb-8 text-center">
        <div className="flex items-center gap-3 justify-center">
          <span className="w-4 h-4 rounded-full bg-[var(--brand)] shadow-[0_0_0_2.5px_var(--fg)]" aria-hidden="true" />
          <span className="font-display font-extrabold text-[56px] leading-none tracking-[0.08em] text-[var(--fg)]">
            SEÑAL
          </span>
        </div>
        <p className="font-body text-base text-[var(--fg-muted)] mt-2">
          Tu operación en movimiento, siempre.
        </p>
      </div>

      {/* Wrapper de steps */}
      <div className="relative z-10 w-full max-w-[380px] flex flex-col gap-4">

        {/* ── Cédula ── */}
        {step === 'cedula' && (
          <AnimatePresence mode="wait" initial={false}>
            {showAdminLogin ? (
              /* ── Panel de ingreso administradores ── */
              <motion.div
                key="admin-login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex flex-col gap-4"
              >
                {/* Banner de error OAuth (viene de OAuthCallbackPage) */}
                {oauthError && (
                  <div
                    role="alert"
                    className="rounded-[14px] bg-red-500/10 border-[1.5px] border-red-500/45 px-4 py-3"
                  >
                    <p className="text-base font-body font-medium text-red-400 leading-snug">
                      {oauthError}
                    </p>
                  </div>
                )}

                <div className="text-center mb-1">
                  <h2 className="font-display font-bold text-3xl leading-tight text-[var(--fg)]">
                    Ingresa con tu cuenta
                  </h2>
                  <p className="text-base text-[var(--fg-muted)] font-body mt-1">
                    Vincula tu cuenta corporativa para acceder al panel de administración.
                  </p>
                </div>

                <OAuthButtons flags={featureFlags} isLoading={flagsLoading} />

                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="min-h-[48px] inline-flex items-center justify-center gap-1.5 text-base font-semibold text-center text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors font-body bg-transparent border-none cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                  Volver al ingreso de operarios
                </button>
              </motion.div>
            ) : (
              /* ── Formulario de cédula (flujo operarios) ── */
              <motion.div
                key="operator-login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {/* Banner de error OAuth (viene de OAuthCallbackPage) */}
                {oauthError && (
                  <div
                    role="alert"
                    className="rounded-[14px] bg-red-500/10 border-[1.5px] border-red-500/45 px-4 py-3 mb-4"
                  >
                    <p className="text-base font-body font-medium text-red-400 leading-snug">
                      {oauthError}
                    </p>
                  </div>
                )}

                <form data-testid="login-form" onSubmit={handleContinuar} className="flex flex-col gap-5">
                  <div>
                    <label
                      htmlFor="cedula-input"
                      className="text-lg font-semibold text-[var(--fg)] mb-2 block font-body"
                    >
                      Número de identificación
                    </label>
                    <input
                      id="cedula-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej. 1234567890"
                      autoComplete="username"
                      className="w-full min-h-[64px] bg-[var(--surface)] border-[1.5px] border-[color:var(--line-strong)] rounded-[16px] px-5 text-2xl font-semibold text-[var(--fg)] placeholder:text-[var(--fg-muted)] placeholder:font-normal font-body outline-none focus:border-[color:var(--fg)] focus:ring-4 focus:ring-[color:var(--wash-brand)] transition-[border-color,box-shadow]"
                      required
                    />
                  </div>
                  <button
                    data-testid="login-submit"
                    type="submit"
                    disabled={!cedula.trim()}
                    className="btn-primary-gradient w-full min-h-[60px] rounded-[16px] text-lg"
                  >
                    Continuar
                  </button>

                  {/* Botón discreto de ingreso administradores */}
                  <button
                    type="button"
                    onClick={() => setShowAdminLogin(true)}
                    className="min-h-[48px] text-base font-semibold text-center text-[var(--fg-muted)] hover:text-[var(--fg)] underline underline-offset-4 decoration-[var(--line-strong)] transition-colors font-body bg-transparent border-none cursor-pointer"
                  >
                    Ingreso administradores
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── Verificando ── */}
        {step === 'loading' && (
          <div className="flex flex-col items-center gap-5 py-8">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <p className="text-base text-center font-body text-[var(--fg-muted)]">
              Verificando…
            </p>
          </div>
        )}

        {/* ── Registro biométrico ── */}
        {step === 'webauthn-register' && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-[22px] bg-[var(--brand)] text-[var(--on-brand)] flex items-center justify-center">
                <Fingerprint className="w-11 h-11" />
              </div>
              <h2 className="font-display font-bold text-3xl leading-tight text-[var(--fg)]">
                {biometricFailed ? 'No se pudo activar' : 'Registra tu biométrico'}
              </h2>
              <p className="text-base text-[var(--fg-muted)] font-body mt-2 leading-relaxed">
                {biometricFailed
                  ? 'No fue posible registrar el biométrico. Crea un PIN para ingresar de forma segura.'
                  : 'Tu dispositivo soporta huella o Face ID. Actívalo para ingresar de forma rápida y segura.'}
              </p>
            </div>

            {!biometricFailed && (
              <button
                type="button"
                onClick={handleWebAuthnRegister}
                disabled={registeringBiometric}
                className="btn-primary-gradient w-full min-h-[60px] rounded-[16px] text-lg"
              >
                {registeringBiometric ? 'Activando…' : 'Activar biométrico'}
              </button>
            )}

            <button
              type="button"
              onClick={() => { setStep('pin-create'); setCreatePhase('new') }}
              className={
                biometricFailed
                  ? 'btn-primary-gradient w-full min-h-[60px] rounded-[16px] text-lg'
                  : 'min-h-[48px] text-base font-semibold text-center text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors font-body bg-transparent border-none cursor-pointer'
              }
            >
              {biometricFailed ? 'Crear PIN de acceso' : 'Continuar con PIN'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('cedula'); setBiometricFailed(false) }}
              className="min-h-[48px] inline-flex items-center justify-center gap-1.5 text-base font-semibold text-center text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors font-body bg-transparent border-none cursor-pointer"
            >
              Cambiar cédula
            </button>
          </div>
        )}

        {/* ── Necesita código de activación (primer acceso) ── */}
        {step === 'need-activation' && (
          <div className="flex flex-col gap-5 text-center">
            <div>
              <h2 className="font-display font-bold text-3xl leading-tight text-[var(--fg)]">
                Necesitas tu enlace de activación
              </h2>
              <p className="text-base text-[var(--fg-muted)] font-body mt-2 leading-relaxed">
                Para crear tu PIN o registrar tu biométrico por primera vez, abre
                el enlace de activación que te compartió tu administrador. Por
                seguridad, no es posible activar la cuenta solo con la cédula.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setStep('cedula'); setBiometricFailed(false) }}
              className="min-h-[48px] inline-flex items-center justify-center gap-1.5 text-base font-semibold text-center text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors font-body bg-transparent border-none cursor-pointer"
            >
              Volver
            </button>
          </div>
        )}

        {/* ── PIN existente ── */}
        {step === 'pin' && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <h2 className="font-display font-bold text-3xl leading-tight text-[var(--fg)]">
                Ingresa tu PIN
              </h2>
            </div>
            {verifyPin.isError && (
              <p data-testid="login-error" className="text-base font-semibold text-red-400 text-center font-body">
                PIN incorrecto
              </p>
            )}
            <PinDots count={pinDigits.length} />
            <NumPad
              onDigit={handlePinDigit}
              onBack={() => setPinDigits((p) => p.slice(0, -1))}
              disabled={verifyPin.isPending}
            />
            <button
              type="button"
              onClick={handlePinSubmit}
              disabled={pinDigits.length < 4 || verifyPin.isPending}
              className="btn-primary-gradient w-full min-h-[60px] rounded-[16px] text-lg"
            >
              {verifyPin.isPending ? 'Verificando…' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('cedula'); setPinDigits([]) }}
              className="min-h-[48px] inline-flex items-center justify-center gap-1.5 text-base font-semibold text-center text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors font-body bg-transparent border-none cursor-pointer"
            >
              Cambiar cédula
            </button>
          </div>
        )}

        {/* ── Crear PIN ── */}
        {step === 'pin-create' && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <h2 className="font-display font-bold text-3xl leading-tight text-[var(--fg)]">
                {createPhase === 'new' ? 'Crea tu PIN de acceso' : 'Confirma tu PIN'}
              </h2>
              <p className="text-base mt-1 text-[var(--fg-muted)] font-body">
                {createPhase === 'new'
                  ? 'Mínimo 4 dígitos'
                  : 'Ingresa el mismo PIN para confirmar'}
              </p>
            </div>
            <PinDots count={createPhase === 'new' ? newDigits.length : confirmDigits.length} />
            <NumPad
              onDigit={handleCreateDigit}
              onBack={handleCreateBack}
              disabled={initPin.isPending}
            />
            <button
              type="button"
              onClick={handleCreateNext}
              disabled={
                initPin.isPending ||
                (createPhase === 'new' ? newDigits.length < 4 : confirmDigits.length < 4)
              }
              className="btn-primary-gradient w-full min-h-[60px] rounded-[16px] text-lg"
            >
              {initPin.isPending
                ? 'Guardando…'
                : createPhase === 'new'
                ? 'Siguiente'
                : 'Confirmar y entrar'}
            </button>
            {createPhase === 'confirm' && (
              <button
                type="button"
                onClick={() => { setCreatePhase('new'); setNewDigits([]); setConfirmDigits([]) }}
                className="min-h-[48px] inline-flex items-center justify-center gap-1.5 text-base font-semibold text-center text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors font-body bg-transparent border-none cursor-pointer"
              >
                Volver a ingresar PIN
              </button>
            )}
            <button
              type="button"
              onClick={() => { setStep('cedula'); setNewDigits([]); setConfirmDigits([]) }}
              className="min-h-[48px] inline-flex items-center justify-center gap-1.5 text-base font-semibold text-center text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors font-body bg-transparent border-none cursor-pointer"
            >
              Cambiar cédula
            </button>
          </div>
        )}

      </div>

      {showLiteBanner && (
        <LiteModeBanner
          onIgnore={() => setShowLiteBanner(false)}
          onActivate={() => {
            sessionStorage.setItem('lite_mode', 'true')
            setShowLiteBanner(false)
          }}
        />
      )}
    </div>
  )
}
