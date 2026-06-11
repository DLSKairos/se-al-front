/**
 * OAuthButtons — botones de ingreso con Google y Microsoft.
 *
 * Usado en LoginPage (modo admin) y en ActivateAccountPage.
 * Cuando se provee `magicToken`, se añade al redirect de OAuth para
 * que el backend vincule la cuenta al token de activación.
 */

import { oauthLoginUrl } from '@/lib/api'
import type { FeatureFlags } from '@/types'

interface OAuthButtonsProps {
  /** Token de magic link de activación (ActivateAccountPage). Opcional. */
  magicToken?: string
  /** Feature flags del sistema. Si null, no renderiza nada (cargando). */
  flags: FeatureFlags | null | undefined
  /** Estado de carga del query de flags. */
  isLoading?: boolean
}

// ── SVG logos ────────────────────────────────────────────────────────────────

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  )
}

function MicrosoftLogo() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1"  y="1"  width="10.5" height="10.5" fill="#F25022" />
      <rect x="12.5" y="1"  width="10.5" height="10.5" fill="#7FBA00" />
      <rect x="1"  y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
    </svg>
  )
}

// ── Botón base ────────────────────────────────────────────────────────────────

function OAuthButton({
  logo,
  label,
  onClick,
}: {
  logo: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 min-h-[48px] rounded-[14px] border border-white/20 bg-white/5 text-[var(--off-white)] font-dm text-sm font-medium hover:bg-white/10 hover:border-white/35 active:scale-[0.98] transition-all"
    >
      {logo}
      <span>{label}</span>
    </button>
  )
}

// ── Componente exportado ──────────────────────────────────────────────────────

export default function OAuthButtons({ magicToken, flags, isLoading }: OAuthButtonsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="w-full h-12 rounded-[14px] bg-white/5 animate-pulse" />
        <div className="w-full h-12 rounded-[14px] bg-white/5 animate-pulse" />
      </div>
    )
  }

  const googleEnabled    = flags?.oauth_google    ?? false
  const microsoftEnabled = flags?.oauth_microsoft ?? false

  if (!googleEnabled && !microsoftEnabled) {
    return (
      <p className="text-sm text-center font-dm text-[var(--muted)] leading-relaxed px-2">
        El ingreso de administradores no está habilitado todavía.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {googleEnabled && (
        <OAuthButton
          logo={<GoogleLogo />}
          label="Continuar con Google"
          onClick={() => {
            window.location.href = oauthLoginUrl('google', magicToken)
          }}
        />
      )}
      {microsoftEnabled && (
        <OAuthButton
          logo={<MicrosoftLogo />}
          label="Continuar con Microsoft"
          onClick={() => {
            window.location.href = oauthLoginUrl('microsoft', magicToken)
          }}
        />
      )}
    </div>
  )
}
