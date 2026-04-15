/**
 * TimeRegister — captura automática de hora del dispositivo
 *
 * Props:
 *   question  object — { id, question, icon?, fieldName }
 *   onAnswer  fn     — (questionId, isoString: string) => void
 */
import { useState } from 'react'
import TypewriterQuestion from './TypewriterQuestion'

interface TimeRegisterProps {
  question: {
    id: string
    question: string
    icon?: string
    fieldName?: string
  }
  onAnswer: (questionId: string, value: string) => void
}

function formatDisplayTime(date: Date): string {
  let hours    = date.getHours()
  const mins   = String(date.getMinutes()).padStart(2, '0')
  const period = hours >= 12 ? 'p.m.' : 'a.m.'
  hours        = hours % 12 || 12
  return `${hours}:${mins} ${period}`
}

function TimeRegister({ question, onAnswer }: TimeRegisterProps) {
  const [capturedTime] = useState<Date>(() => new Date())
  const [confirmed,   setConfirmed]  = useState(false)
  const [typingDone,  setTypingDone] = useState(false)

  const handleConfirm = () => {
    if (confirmed) return
    setConfirmed(true)
    onAnswer(question.id, capturedTime.toISOString())
  }

  const displayTime = formatDisplayTime(capturedTime)

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {question.icon && (
        <div className="text-4xl" aria-hidden="true">{question.icon}</div>
      )}

      <div className="w-full max-w-sm">
        <div className="glass-card-md px-4 py-3">
          <TypewriterQuestion
            text={question.question}
            onDone={() => setTypingDone(true)}
          />
        </div>
        <div className="w-0 h-0 mx-auto speech-triangle-down" aria-hidden="true" />
      </div>

      <div
        className={[
          'flex flex-col items-center gap-3 transition-all duration-300',
          typingDone ? 'opacity-100 game-bounce-in' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <div
          className="flex flex-col items-center gap-1 px-8 py-4 rounded-2xl bg-[var(--navy-light)] border border-white/10"
          aria-label={`Hora registrada: ${displayTime}`}
        >
          <span className="text-3xl" aria-hidden="true">🕐</span>
          <span className="text-3xl font-bold text-[var(--signal)] font-['Syne']">
            {displayTime}
          </span>
          <span className="text-xs text-[var(--muted)] font-['DM_Sans']">
            hora del dispositivo
          </span>
        </div>

        <button
          className={[
            'px-6 py-3 rounded-xl font-bold font-["Syne"] text-sm transition-all duration-200',
            confirmed
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-[var(--signal)] text-[var(--navy)] hover:opacity-90 active:scale-95',
          ].join(' ')}
          onClick={handleConfirm}
          disabled={confirmed}
          aria-label="Confirmar hora registrada"
        >
          {confirmed ? '✓ Registrado' : 'Confirmar hora →'}
        </button>
      </div>
    </div>
  )
}

export default TimeRegister
