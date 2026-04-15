/**
 * OrientationLock — modo estricto
 *
 * Bloquea el dispositivo en landscape o muestra overlay non-dismissible.
 * Solo renderiza `children` cuando está en landscape.
 */
import { useState, useEffect, useRef, ReactNode } from 'react'

const PULSE_DELAYS_5 = [
  '[animation-delay:0s]',
  '[animation-delay:0.15s]',
  '[animation-delay:0.30s]',
  '[animation-delay:0.45s]',
  '[animation-delay:0.60s]',
] as const

function checkLandscape(): boolean {
  if ((screen.orientation as ScreenOrientation | undefined)?.type) {
    return screen.orientation.type.startsWith('landscape')
  }
  return window.innerWidth > window.innerHeight
}

interface OrientationLockProps {
  children: ReactNode
}

function PhoneSVG({ landscape = false }: { landscape?: boolean }) {
  return (
    <svg
      className={['w-16 h-auto', landscape ? 'rotate-90' : ''].join(' ')}
      viewBox="0 0 60 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3" y="3" width="54" height="94" rx="9"
        stroke="currentColor" strokeWidth="3.5"
        fill="rgba(255,255,255,0.04)"
      />
      <circle cx="30" cy="88" r="4" fill="currentColor" opacity="0.5" />
      <rect x="18" y="9" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.35" />
      <rect x="9" y="18" width="42" height="62" rx="3" fill="rgba(255,255,255,0.06)" />
    </svg>
  )
}

function OrientationLock({ children }: OrientationLockProps) {
  const [landscape,    setLandscape]    = useState(checkLandscape)
  const lockAttempted = useRef(false)

  useEffect(() => {
    if (lockAttempted.current) return
    lockAttempted.current = true

    if ((screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock) {
      (screen.orientation as ScreenOrientation & { lock: (o: string) => Promise<void> })
        .lock('landscape')
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    const update = () => setLandscape(checkLandscape())

    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    screen.orientation?.addEventListener('change', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      screen.orientation?.removeEventListener('change', update)
    }
  }, [])

  if (!landscape) {
    return (
      <div
        className="fixed inset-0 z-[9000] flex flex-col items-center justify-center bg-[var(--navy)] text-[var(--off-white)] p-6 text-center gap-8"
        role="alert"
        aria-live="polite"
      >
        {/* Dots background */}
        <div
          className="absolute inset-0 opacity-10 bg-dots-signal"
        />

        <div className="relative flex items-center gap-6">
          <div className="text-[var(--muted)]">
            <PhoneSVG />
          </div>
          <svg
            className="w-12 h-8 text-[var(--signal)]"
            viewBox="0 0 100 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 10 50 Q 50 -10 90 50"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="8 4"
            />
            <polygon points="90,42 90,58 80,50" fill="currentColor" />
          </svg>
          <div className="text-[var(--signal)]">
            <PhoneSVG landscape />
          </div>
        </div>

        <div className="relative">
          <h2 className="text-xl font-bold font-['Syne'] text-[var(--off-white)] mb-2">
            Modo horizontal requerido
          </h2>
          <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
            Gira tu dispositivo para continuar la misión, héroe
          </p>
        </div>

        <div className="relative flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`w-1.5 h-8 rounded-full bg-[var(--signal)] opacity-40 animate-pulse ${PULSE_DELAYS_5[i]}`}
            />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--signal)] opacity-30" />
      </div>
    )
  }

  return <>{children}</>
}

export default OrientationLock
