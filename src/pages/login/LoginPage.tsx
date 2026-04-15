import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { SplashScreen } from '@/components/ui'
import { authenticateWebAuthn } from '@/lib/webauthn'
import type { UserRole } from '@/types'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PinStatusResponse {
  pinEnabled: boolean
  pinConfigured: boolean
}

interface TokenResponse {
  access_token: string
}

type Step = 'splash' | 'cedula' | 'loading' | 'pin' | 'pin-create'
type CreatePhase = 'new' | 'confirm'

// ── Helpers ───────────────────────────────────────────────────────────────────

function redirectByRole(role: UserRole, navigate: ReturnType<typeof useNavigate>) {
  if (role === 'SUPER_ADMIN') navigate('/super')
  else if (role === 'ADMIN') navigate('/admin')
  else navigate('/location-select')
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function PinDots({ count, total = 6 }: { count: number; total?: number }) {
  return (
    <div className="flex justify-center gap-3 my-2" aria-label="Dígitos ingresados">
      {Array.from({ length: Math.max(4, count, total) }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`w-3 h-3 rounded-full transition-all ${
            i < count
              ? 'bg-[var(--signal)] scale-110'
              : 'bg-white/10 border border-white/20'
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
            className={`w-full h-16 rounded-[14px] font-display font-bold text-xl active:scale-[0.97] transition-all disabled:opacity-40 ${
              isBack
                ? 'bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] text-red-400 hover:bg-[rgba(239,68,68,0.15)]'
                : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.1)] text-[var(--off-white)] hover:bg-[rgba(0,212,255,0.08)] hover:border-[rgba(0,212,255,0.25)]'
            }`}
          >
            {key}
          </button>
        )
      })}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate  = useNavigate()
  const setToken  = useAuthStore((s) => s.setToken)
  const toast     = useToast()

  const [step,          setStep]          = useState<Step>('splash')
  const [cedula,        setCedula]        = useState('')
  const [pinDigits,     setPinDigits]     = useState<string[]>([])
  const [newDigits,     setNewDigits]     = useState<string[]>([])
  const [confirmDigits, setConfirmDigits] = useState<string[]>([])
  const [createPhase,   setCreatePhase]   = useState<CreatePhase>('new')

  // ── Login con token ──────────────────────────────────────────────────────────

  function handleToken(access_token: string) {
    setToken(access_token)
    const role = useAuthStore.getState().user?.role
    if (role) redirectByRole(role, navigate)
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
      }),
    onSuccess: (res) => handleToken(res.data.access_token),
    onError:   () => toast.error('No se pudo crear el PIN. Intenta de nuevo.'),
  })

  // ── Flujo principal: Continuar ────────────────────────────────────────────────

  async function handleContinuar(e: React.FormEvent) {
    e.preventDefault()
    if (!cedula.trim()) return
    setStep('loading')

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

    try {
      const token = await authenticateWebAuthn(cedula.trim())
      handleToken(token)
      return
    } catch {
      // WebAuthn no disponible — continuar con PIN
    }

    if (status.pinConfigured) {
      setStep('pin')
    } else {
      setStep('pin-create')
      setCreatePhase('new')
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
    <div className="fixed inset-0 bg-[var(--navy)] flex flex-col items-center justify-center px-6 overflow-auto">

      {/* Splash — self-managing, cubre todo hasta llamar onDone */}
      <SplashScreen onDone={() => setStep('cedula')} />

      {/* Grid overlay decorativo */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orb */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <div className="relative z-10 mb-8 text-center">
        <div className="flex items-center gap-2.5 mb-2 justify-center">
          <div className="w-2.5 h-2.5 bg-[var(--signal)] rounded-full animate-pulse-dot" />
          <span className="font-display font-extrabold text-2xl tracking-[0.15em] text-[var(--off-white)]">
            SEÑAL
          </span>
        </div>
        <p className="font-serif italic font-light text-sm text-[var(--muted)]">
          Tu operación en movimiento, siempre.
        </p>
      </div>

      {/* Wrapper de steps */}
      <div className="relative z-10 w-full max-w-[340px] flex flex-col gap-4">

        {/* ── Cédula ── */}
        {step === 'cedula' && (
          <form onSubmit={handleContinuar} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="cedula-input"
                className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-2 block"
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
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[14px] px-5 py-4 text-base text-[var(--off-white)] placeholder-[var(--muted)] font-dm outline-none focus:border-[var(--signal)] transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!cedula.trim()}
              className="btn-primary-gradient w-full py-4 rounded-[14px]"
            >
              Continuar
            </button>
          </form>
        )}

        {/* ── Verificando ── */}
        {step === 'loading' && (
          <div className="flex flex-col items-center gap-5 py-8">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <p className="text-sm text-center font-dm text-[var(--muted)]">
              Verificando huella o llave de acceso…
            </p>
          </div>
        )}

        {/* ── PIN existente ── */}
        {step === 'pin' && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-1">
                PIN de acceso
              </p>
              <h2 className="font-display font-bold text-xl text-[var(--off-white)]">
                Ingresa tu PIN
              </h2>
            </div>
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
              className="btn-primary-gradient w-full py-4 rounded-[14px]"
            >
              {verifyPin.isPending ? 'Verificando…' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('cedula'); setPinDigits([]) }}
              className="text-xs text-center text-[var(--muted)] hover:text-[var(--off-white)] transition-colors font-dm bg-transparent border-none cursor-pointer p-0"
            >
              Cambiar cédula
            </button>
          </div>
        )}

        {/* ── Crear PIN ── */}
        {step === 'pin-create' && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-1">
                {createPhase === 'new' ? 'Nuevo PIN' : 'Confirmar PIN'}
              </p>
              <h2 className="font-display font-bold text-xl text-[var(--off-white)]">
                {createPhase === 'new' ? 'Crea tu PIN de acceso' : 'Confirma tu PIN'}
              </h2>
              <p className="text-xs mt-1 text-[var(--muted)] font-dm">
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
              className="btn-primary-gradient w-full py-4 rounded-[14px]"
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
                className="text-xs text-center text-[var(--muted)] hover:text-[var(--off-white)] transition-colors font-dm bg-transparent border-none cursor-pointer p-0"
              >
                Volver a ingresar PIN
              </button>
            )}
            <button
              type="button"
              onClick={() => { setStep('cedula'); setNewDigits([]); setConfirmDigits([]) }}
              className="text-xs text-center text-[var(--muted)] hover:text-[var(--off-white)] transition-colors font-dm bg-transparent border-none cursor-pointer p-0"
            >
              Cambiar cédula
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
