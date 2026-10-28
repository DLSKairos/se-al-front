/**
 * StoryIntro — saludo de inicio de jornada con diálogos tipo máquina de escribir
 *
 * Props:
 *   character  string — clave del personaje (imagen opcional en /assets)
 *   obraName   string — nombre de la obra
 *   onComplete fn     — callback al terminar todos los diálogos
 */
import { useState, useEffect, useRef } from 'react'
import { HardHat } from 'lucide-react'

const TYPEWRITER_SPEED = 28
const DIALOG_PAUSE     = 1500

function buildDialogs(characterName: string, obraName: string): string[] {
  return [
    `${characterName}, hoy tienes una jornada importante por delante.`,
    `En ${obraName}, tu trabajo marca la diferencia.`,
    `Completa tus registros del día para mantener la operación al día.`,
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

  const onCompleteRef   = useRef(onComplete)
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  const clearAll = () => {
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current)
    if (autoTimerRef.current)   clearTimeout(autoTimerRef.current)
  }

  const handleSkip = () => {
    clearAll()
    onCompleteRef.current?.()
  }

  useEffect(() => {
    clearAll()
    setDisplayedText('')
    setIsTyping(true)

    let i = 0
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
    <div className="fixed inset-0 z-[8000] route-bg flex flex-col items-center justify-between p-5" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)' }}>
      <div className="hazard absolute inset-x-0 top-0 h-3" aria-hidden="true" />

      <div className="relative w-full flex justify-end pt-3">
        <button
          className="liquid min-h-[48px] px-5 rounded-full text-[var(--fg)] text-base font-bold font-body"
          onClick={handleSkip}
          aria-label="Saltar introducción"
        >
          Saltar
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        {!imgError ? (
          <img
            src={`/assets/${character}-idle.png`}
            alt={characterName}
            className="h-56 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="w-40 h-40 rounded-[44px] bg-[var(--brand)] text-[var(--on-brand)] grid place-items-center shadow-[inset_0_2px_0_rgba(255,255,255,0.55),0_24px_40px_-18px_rgba(168,127,0,0.9)]" aria-hidden="true">
            <HardHat className="w-24 h-24" strokeWidth={1.75} />
          </span>
        )}
      </div>

      <div className="relative w-full max-w-sm mb-6">
        <div className="liquid rounded-[28px] px-6 py-5 min-h-[120px] flex items-center">
          <p className="text-[var(--fg)] text-[26px] leading-tight font-display font-bold m-0" aria-live="polite">
            {displayedText}
            {isTyping && (
              <span className="game-cursor inline-block w-[3px] h-6 bg-[var(--fg)] ml-0.5 align-middle" aria-hidden="true" />
            )}
          </p>
        </div>
      </div>

      <div
        className="relative flex gap-2 mb-3 w-full max-w-sm"
        role="status"
        aria-label={`Diálogo ${dialogIndex + 1} de ${dialogs.length}`}
      >
        {dialogs.map((_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
              i <= dialogIndex ? 'bg-[var(--fg)]' : 'bg-[var(--line-strong)]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default StoryIntro
