/**
 * Ruta pública: /activar?token=xxx
 *
 * Pantalla de activación de cuenta admin vía magic link.
 * El admin llega aquí desde el link enviado por email, valida el token
 * y vincula su cuenta Google/Microsoft para quedar activo.
 */

import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { magicLinkApi, featureFlagsApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import OAuthButtons from '@/components/auth/OAuthButtons'
import type { MagicLinkPurpose } from '@/types'

// ── Helpers visuales ──────────────────────────────────────────────────────────

function SignalLogo() {
  return (
    <div className="flex items-center gap-2.5 justify-center mb-2">
      <div
        className="w-2.5 h-2.5 rounded-full animate-pulse"
        style={{ background: '#00D4FF' }}
      />
      <span
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '1.5rem',
          letterSpacing: '0.15em',
          color: '#F0F4F8',
        }}
      >
        SEÑAL
      </span>
    </div>
  )
}

// ── Pantalla: sin token en URL ────────────────────────────────────────────────

function MissingTokenScreen() {
  return (
    <div className="text-center flex flex-col gap-4">
      <SignalLogo />
      <div
        className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
        aria-hidden="true"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            stroke="#f87171"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <h1
          style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#F0F4F8' }}
        >
          Enlace inválido
        </h1>
        <p
          className="mt-2 leading-relaxed"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'rgba(240,244,248,0.55)' }}
        >
          Este enlace de activación no es válido. Solicita a tu administrador que te envíe un nuevo enlace.
        </p>
      </div>
    </div>
  )
}

// ── Pantalla: error por código ────────────────────────────────────────────────

/**
 * TOKEN_ALREADY_USED es el código real que devuelve el backend (magic-link.service.ts).
 * El tipo MagicLinkInfo.error en src/types tiene TOKEN_USED por una discrepancia
 * pendiente de corrección — manejamos ambos aquí con un cast explícito.
 */
type TokenErrorCode = 'TOKEN_NOT_FOUND' | 'TOKEN_EXPIRED' | 'TOKEN_USED' | 'TOKEN_ALREADY_USED'

const ERROR_MESSAGES: Record<TokenErrorCode, { title: string; body: string }> = {
  TOKEN_NOT_FOUND: {
    title: 'Enlace no encontrado',
    body: 'Este enlace de activación no existe o fue eliminado. Pide a tu administrador que genere uno nuevo.',
  },
  TOKEN_EXPIRED: {
    title: 'Tu enlace expiró',
    body: 'Tu enlace expiró, pide a tu administrador que lo reenvíe.',
  },
  TOKEN_USED: {
    title: 'Enlace ya utilizado',
    body: 'Este enlace ya fue utilizado para activar una cuenta. Si aún no puedes acceder, contacta a tu administrador.',
  },
  TOKEN_ALREADY_USED: {
    title: 'Enlace ya utilizado',
    body: 'Este enlace ya fue utilizado para activar una cuenta. Si aún no puedes acceder, contacta a tu administrador.',
  },
}

function ErrorScreen({ code }: { code: TokenErrorCode }) {
  const msg = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.TOKEN_NOT_FOUND

  return (
    <div className="text-center flex flex-col gap-4">
      <SignalLogo />
      <div
        className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
        aria-hidden="true"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
          <path d="M15 9l-6 6M9 9l6 6" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <h1
          style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#F0F4F8' }}
        >
          {msg.title}
        </h1>
        <p
          className="mt-2 leading-relaxed"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'rgba(240,244,248,0.55)' }}
        >
          {msg.body}
        </p>
      </div>
    </div>
  )
}

// ── Pantalla: cargando ────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center gap-6">
      <SignalLogo />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#00D4FF', animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <p
        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'rgba(240,244,248,0.55)' }}
      >
        Verificando enlace…
      </p>
    </div>
  )
}

// ── Pantalla: activación exitosa ──────────────────────────────────────────────

function ActivationScreen({
  token,
  userName,
  orgName,
  purpose,
  flagsLoading,
  featureFlags,
}: {
  token: string
  userName: string
  orgName: string
  purpose: MagicLinkPurpose
  flagsLoading: boolean
  featureFlags: import('@/types').FeatureFlags | undefined
}) {
  const isInvite = purpose === 'ADMIN_INVITE'

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="text-center">
        <SignalLogo />
        <p
          className="mt-1"
          style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '0.875rem', color: 'rgba(240,244,248,0.55)' }}
        >
          Tu operación en movimiento, siempre.
        </p>
      </div>

      {/* Icono de bienvenida */}
      <div
        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}
        aria-hidden="true"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke="#00D4FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="7"
            r="4"
            stroke="#00D4FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Bienvenida */}
      <div className="text-center">
        {isInvite ? (
          <>
            <p
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#00D4FF' }}
              className="mb-1"
            >
              Invitación
            </p>
            <h1
              style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#F0F4F8' }}
            >
              Has sido invitado/a como administrador/a
            </h1>
            <p
              className="mt-2"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'rgba(240,244,248,0.7)' }}
            >
              de <span style={{ color: '#F0F4F8', fontWeight: 600 }}>{orgName}</span> en SEÑAL
            </p>
          </>
        ) : (
          <>
            <p
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#00D4FF' }}
              className="mb-1"
            >
              Activación de cuenta
            </p>
            <h1
              style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#F0F4F8' }}
            >
              ¡Bienvenido/a, {userName}!
            </h1>
            <p
              className="mt-2 leading-relaxed"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'rgba(240,244,248,0.7)' }}
            >
              Tu cuenta de administrador en{' '}
              <span style={{ color: '#F0F4F8', fontWeight: 600 }}>{orgName}</span> está lista.
            </p>
          </>
        )}
      </div>

      {/* Divisor */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

      {/* CTA de vinculación */}
      <div className="flex flex-col gap-3">
        <p
          className="text-center"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8125rem', color: 'rgba(240,244,248,0.6)' }}
        >
          Para activar tu cuenta, vincúlala con tu correo:
        </p>
        <OAuthButtons magicToken={token} flags={featureFlags} isLoading={flagsLoading} />
        <p
          className="text-center text-xs"
          style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(240,244,248,0.35)' }}
        >
          No se crea contraseña. Usarás tu cuenta de Google o Microsoft para ingresar.
        </p>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function ActivateAccountPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  // Query de validación — solo si hay token
  const { data: linkInfo, isLoading, isError } = useQuery({
    queryKey: QK.magicLinkValidate(token),
    queryFn: () => magicLinkApi.validate(token!).then((r) => r.data),
    enabled: !!token,
    // No reintentar en errores de validación (TOKEN_EXPIRED, etc.)
    retry: false,
    staleTime: Infinity,
  })

  // Feature flags para mostrar los botones OAuth correctamente
  const { data: featureFlags, isLoading: flagsLoading } = useQuery({
    queryKey: QK.featureFlags(),
    queryFn: () => featureFlagsApi.getAll().then((r) => r.data),
    staleTime: 30_000,
    // Solo cargar si el token es válido y va a mostrarse la pantalla de activación
    enabled: !!token && !!linkInfo?.valid,
  })

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{ background: '#0C1624' }}
    >
      {/* Grid overlay decorativo */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage:
            'linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orb */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.09) 0%, transparent 70%)' }}
      />

      {/* Tarjeta glass centrada */}
      <div
        className="relative z-10 w-full max-w-[380px] rounded-[18px] p-7"
        style={{
          background: 'rgba(17,30,48,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
        }}
      >
        {/* Sin token en URL */}
        {!token && <MissingTokenScreen />}

        {/* Cargando */}
        {token && isLoading && <LoadingScreen />}

        {/* Error de red u otro */}
        {token && isError && !isLoading && (
          <ErrorScreen code="TOKEN_NOT_FOUND" />
        )}

        {/* Respuesta del backend recibida */}
        {token && linkInfo && !isLoading && (
          <>
            {!linkInfo.valid && linkInfo.error ? (
              <ErrorScreen
                code={
                  linkInfo.error === 'TOKEN_EXPIRED'
                    ? 'TOKEN_EXPIRED'
                    : linkInfo.error === 'TOKEN_ALREADY_USED'
                    ? 'TOKEN_ALREADY_USED'
                    : 'TOKEN_NOT_FOUND'
                }
              />
            ) : linkInfo.valid && linkInfo.adminName && linkInfo.orgName && linkInfo.purpose ? (
              <ActivationScreen
                token={token}
                userName={linkInfo.adminName}
                orgName={linkInfo.orgName}
                purpose={linkInfo.purpose}
                flagsLoading={flagsLoading}
                featureFlags={featureFlags}
              />
            ) : (
              /* Respuesta inesperada — tratar como error genérico */
              <ErrorScreen code="TOKEN_NOT_FOUND" />
            )}
          </>
        )}
      </div>
    </div>
  )
}
