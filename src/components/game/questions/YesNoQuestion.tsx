/**
 * YesNoQuestion — bocadillo de diálogo + botones táctiles
 *
 * Props simplificadas para nueva API:
 *   onAnswer  fn  — (value: boolean) => void
 *
 * El componente también expone la variante "legacy" con question object
 * para compatibilidad con QuestionWrapper existente.
 */
import { useState, useRef, useEffect } from 'react'
import TypewriterQuestion from './TypewriterQuestion'

interface YesNoQuestionProps {
  /** Modo nuevo API: callback simple con booleano */
  onAnswer: (value: boolean) => void
  /** Modo legacy QuestionWrapper: objeto pregunta */
  question?: {
    id: string
    question: string
    icon?: string
    fieldName?: string
    customOptions?: Array<{
      value: string
      label: string
      icon?: string
      negative?: boolean
    }>
  }
  /** Callback legacy: (questionId, value, extras?) */
  onAnswerLegacy?: (questionId: string, value: string, extras?: Record<string, string>) => void
}

const DEFAULT_OPTIONS = [
  { value: 'yes', label: 'Sí',  icon: '✓', negative: false },
  { value: 'no',  label: 'No',  icon: '✗', negative: true  },
  { value: 'na',  label: 'N/A', icon: '—', negative: false },
]

const OPTION_COLORS: Record<string, string> = {
  yes: 'border-green-500 text-green-400 hover:bg-green-500/20 aria-pressed:bg-green-500/30',
  no:  'border-red-500  text-red-400  hover:bg-red-500/20  aria-pressed:bg-red-500/30',
  na:  'border-slate-400 text-slate-300 hover:bg-slate-500/20 aria-pressed:bg-slate-500/30',
}

function YesNoQuestion({ question, onAnswer, onAnswerLegacy }: YesNoQuestionProps) {
  const [typingDone, setTypingDone] = useState(!question) // si no hay pregunta, ya listo
  const [selected,   setSelected]   = useState<string | null>(null)
  const [showObs,    setShowObs]    = useState(false)
  const [obsText,    setObsText]    = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const options = question?.customOptions ?? DEFAULT_OPTIONS

  useEffect(() => {
    if (showObs && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }, [showObs])

  const handleSelect = (value: string) => {
    if (selected) return
    setSelected(value)

    const opt = options.find((o) => o.value === value)

    // Modo nuevo: convertir yes/no a boolean
    if (!question) {
      onAnswer(value === 'yes')
      return
    }

    if (opt?.negative) {
      setShowObs(true)
    } else {
      onAnswerLegacy?.(question.id, value)
    }
  }

  const handleConfirm = () => {
    if (!question || !selected) return
    const extras = obsText.trim()
      ? { [question.id + '_obs']: obsText.trim() }
      : {}
    onAnswerLegacy?.(question.id, selected, extras)
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {question?.icon && (
        <div className="text-4xl" aria-hidden="true">{question.icon}</div>
      )}

      {question && (
        <div className="w-full max-w-sm">
          <div className="glass-card-md px-4 py-3">
            <TypewriterQuestion
              text={question.question}
              onDone={() => setTypingDone(true)}
            />
          </div>
          <div className="w-0 h-0 mx-auto speech-triangle-down" aria-hidden="true" />
        </div>
      )}

      <div
        className={[
          'flex gap-3 flex-wrap justify-center transition-all duration-300',
          typingDone ? 'opacity-100 translate-y-0 game-bounce-in' : 'opacity-0 translate-y-4 pointer-events-none',
        ].join(' ')}
      >
        {options.map((opt) => {
          const colorCls = OPTION_COLORS[opt.value] ?? OPTION_COLORS.na
          const isChosen = selected === opt.value
          return (
            <button
              key={opt.value}
              className={[
                'flex flex-col items-center gap-1 min-w-[80px] px-5 py-3',
                'rounded-2xl border-2 font-["Syne"] font-bold text-sm',
                'transition-all duration-150 active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                colorCls,
                isChosen ? 'scale-95 ring-2 ring-white/30' : '',
              ].join(' ')}
              onClick={() => handleSelect(opt.value)}
              disabled={!!selected}
              aria-label={opt.label}
              aria-pressed={isChosen}
            >
              <span className="text-xl">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          )
        })}
      </div>

      {showObs && (
        <div
          className="w-full max-w-sm mt-2"
          role="region"
          aria-label="Observaciones"
        >
          <label
            className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wide mb-1 font-['DM_Sans']"
            htmlFor={`obs-${question?.id}`}
          >
            Observación{' '}
            <span className="font-normal normal-case">(opcional)</span>
          </label>
          <textarea
            id={`obs-${question?.id}`}
            ref={textareaRef}
            className={[
              'w-full rounded-xl border border-white/20 bg-[var(--navy-light)]',
              'text-[var(--off-white)] text-sm p-3 font-["DM_Sans"]',
              'placeholder:text-[var(--muted)] resize-none outline-none',
              'focus:border-[var(--signal)] transition-colors',
            ].join(' ')}
            value={obsText}
            onChange={(e) => setObsText(e.target.value)}
            placeholder="Escribe una observación..."
            rows={3}
          />
          <button
            className="mt-2 w-full py-2.5 rounded-xl bg-[var(--signal)] text-[var(--navy)] font-bold font-['Syne'] text-sm hover:opacity-90 transition-opacity"
            onClick={handleConfirm}
          >
            Continuar →
          </button>
        </div>
      )}
    </div>
  )
}

export default YesNoQuestion
