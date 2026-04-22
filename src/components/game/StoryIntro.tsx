/**
 * StoryIntro — intro cinematográfica con diálogos tipo typewriter
 *
 * Props:
 *   character  string — clave del personaje (para imagen)
 *   obraName   string — nombre de la obra
 *   onComplete fn     — callback al terminar todos los diálogos
 */
import { useState, useEffect, useRef } from 'react'

interface NetworkInformation { effectiveType?: '4g' | '3g' | '2g' | 'slow-2g' }
declare global { interface Navigator { connection?: NetworkInformation } }

const TYPEWRITER_SPEED = 50
const DIALOG_PAUSE     = 1600

function buildDialogs(characterName: string, obraName: string): string[] {
  return [
    `${characterName}, hoy tienes una jornada importante por delante`,
    `En ${obraName}, tu trabajo marca la diferencia`,
    `Completa tus registros del día para mantener la operación al día`,
    `Todo listo. ¡Que tengas una jornada segura!`,
  ]
}

interface StoryIntroProps {
  character?:  string
  obraName?:   string
  onComplete?: () => void
}

function StoryIntro({
  character  = 'trabajador',
  obraName   = 'la obra',
  onComplete,
}: StoryIntroProps) {
  const characterName = localStorage.getItem('cargo_trabajador') || 'Operario'
  const dialogs       = buildDialogs(characterName, obraName)

  const [dialogIndex,   setDialogIndex]   = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping,      setIsTyping]      = useState(true)
  const [imgError,      setImgError]      = useState(false)
  const [showNetBanner, setShowNetBanner] = useState(false)

  const onCompleteRef   = useRef(onComplete)
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    const type = navigator.connection?.effectiveType
    if (type && type !== '4g') setShowNetBanner(true)
  }, [])

  const clearAll = () => {
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current)
    if (autoTimerRef.current)   clearTimeout(autoTimerRef.current)
  }

  const handleSkip = () => {
    clearAll()
    onCompleteRef.current?.()
  }

  const handleIgnoreNetBanner = () => setShowNetBanner(false)

  const handleActivateLiteMode = () => {
    sessionStorage.setItem('lite_mode', 'true')
    clearAll()
    onCompleteRef.current?.()
  }

  useEffect(() => {
    clearAll()
    setDisplayedText('')
    setIsTyping(true)

    let i    = 0
    const text = dialogs[dialogIndex]

    typeIntervalRef.current = setInterval(() => {
      i++
      setDisplayedText(text.slice(0, i))

      if (i >= text.length) {
        if (typeIntervalRef.current) clearInterval(typeIntervalRef.current)
        setIsTyping(false)

        autoTimerRef.current = setTimeout(() => {
          if (dialogIndex < dialogs.length - 1) {
            setDialogIndex((prev) => prev + 1)
          } else {
            onCompleteRef.current?.()
          }
        }, DIALOG_PAUSE)
      }
    }, TYPEWRITER_SPEED)

    return clearAll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogIndex])

  return (
    <div className="fixed inset-0 z-[8000] bg-[var(--navy)] flex flex-col items-center justify-between p-6">
      {/* Background subtle gradient */}
      <div className="absolute inset-0 opacity-20 bg-radial-story" />

      {/* Radial burst signal */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 70%, rgba(0,212,255,0.06) 0%, transparent 60%)' }}
      />

      {/* Skip button */}
      <div className="relative w-full flex justify-end">
        <button
          className="glass flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-btn,8px)] text-[var(--muted)] text-xs font-['DM_Sans'] hover:text-[var(--off-white)] transition-colors"
          onClick={handleSkip}
          aria-label="Saltar introducción"
        >
          <span>Saltar intro</span>
          <span className="text-[var(--signal)] font-bold">»</span>
        </button>
      </div>

      {/* Character */}
      <div className="relative flex-1 flex items-end justify-center pb-4">
        {!imgError ? (
          <img
            src={`/assets/${character}-idle.png`}
            alt={characterName}
            className="h-48 object-contain drop-shadow-[0_8px_24px_rgba(0,212,255,0.2)]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-8xl" aria-hidden="true">👷</div>
        )}
      </div>

      {/* Dialog bubble */}
      <div className="relative w-full max-w-sm mb-6">
        <div
          className="w-0 h-0 mx-auto mb-[-1px] speech-triangle-up"
          aria-hidden="true"
        />
        <div className="glass p-5 rounded-[20px] min-h-[72px] flex items-center">
          <p className="text-[var(--off-white)] text-base leading-relaxed font-['DM_Sans'] m-0">
            {displayedText}
            {isTyping && (
              <span
                className="game-cursor inline-block w-0.5 h-4 bg-[var(--signal)] ml-0.5 align-middle"
                aria-hidden="true"
              />
            )}
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div
        className="flex gap-2 mb-2"
        role="status"
        aria-label={`Diálogo ${dialogIndex + 1} de ${dialogs.length}`}
      >
        {dialogs.map((_, i) => (
          <span
            key={i}
            className={[
              'rounded-full transition-all duration-300',
              i === dialogIndex
                ? 'w-5 h-2.5 bg-[var(--signal)]'
                : i < dialogIndex
                ? 'w-2.5 h-2.5 bg-[var(--signal)] opacity-50'
                : 'w-2.5 h-2.5 bg-white/20',
            ].join(' ')}
          />
        ))}
      </div>

      {showNetBanner && (
        <div className="absolute bottom-0 left-0 right-0 z-[8100] px-4 py-3 bg-[rgba(245,166,35,0.12)] border-t border-[rgba(245,166,35,0.25)] flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-sm shrink-0">⚡</span>
            <p className="text-xs text-amber-300 font-['DM_Sans'] flex-1">
              Modo lite — la app te sugiere activarlo
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--off-white)] transition-colors px-3 py-1.5 font-['DM_Sans']"
              onClick={handleIgnoreNetBanner}
            >
              Ignorar
            </button>
            <button
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors px-3 py-1.5 border border-amber-500/30 rounded-lg font-['DM_Sans']"
              onClick={handleActivateLiteMode}
            >
              Activar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StoryIntro
