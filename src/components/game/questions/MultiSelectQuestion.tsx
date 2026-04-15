/**
 * MultiSelectQuestion — grid de cards con flip 180° al seleccionar
 *
 * Props nueva API:
 *   options   Array<{ label: string; value: string }>
 *   multiple  boolean — true = multiselect, false = single select
 *   onAnswer  (value: string | string[]) => void
 *
 * Props legacy QuestionWrapper:
 *   question  object
 *   onAnswer  (questionId, value: string[]) => void
 */
import { useState } from 'react'
import TypewriterQuestion from './TypewriterQuestion'

interface Option {
  label: string
  value: string
  icon?: string
}

interface MultiSelectQuestionProps {
  /** Modo nuevo API */
  options?: Option[]
  multiple?: boolean
  onAnswer: (value: string | string[]) => void

  /** Modo legacy QuestionWrapper */
  question?: {
    id: string
    question: string
    icon?: string
    options?: Option[]
    minSelections?: number
    maxSelections?: number
  }
  onAnswerLegacy?: (questionId: string, value: string[]) => void
}

function MultiSelectQuestion({
  options: propOptions,
  multiple = true,
  onAnswer,
  question,
  onAnswerLegacy,
}: MultiSelectQuestionProps) {
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [confirmed,  setConfirmed]  = useState(false)
  const [typingDone, setTypingDone] = useState(!question)

  const options       = propOptions ?? question?.options ?? []
  const minSelections = question?.minSelections ?? 1
  const maxSelections = question?.maxSelections ?? (multiple ? 99 : 1)

  const toggleOption = (value: string) => {
    if (confirmed) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else if (next.size < maxSelections) {
        next.add(value)
      }
      return next
    })
  }

  const handleConfirm = () => {
    if (selected.size < minSelections || confirmed) return
    setConfirmed(true)
    const values = Array.from(selected)

    if (question) {
      onAnswerLegacy?.(question.id, values)
    } else {
      onAnswer(multiple ? values : (values[0] ?? ''))
    }
  }

  const canConfirm = selected.size >= minSelections

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
          'grid grid-cols-2 gap-2 w-full max-w-sm transition-all duration-300',
          typingDone ? 'opacity-100 game-bounce-in' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        role="group"
        aria-label="Opciones"
      >
        {options.map((opt) => {
          const isSelected = selected.has(opt.value)
          const isDisabled = confirmed || (!isSelected && selected.size >= maxSelections)

          return (
            <button
              key={opt.value}
              className={[
                'relative flex flex-col items-center gap-1.5 p-3 rounded-2xl',
                'border-2 text-sm font-["DM_Sans"] font-medium',
                'transition-all duration-200 active:scale-95',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isSelected
                  ? 'border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--signal)]'
                  : 'border-white/20 bg-[var(--navy-light)] text-[var(--off-white)] hover:border-white/40',
              ].join(' ')}
              onClick={() => toggleOption(opt.value)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              aria-label={opt.label}
            >
              {isSelected && (
                <span
                  className="absolute top-1.5 right-2 text-[var(--signal)] text-xs font-bold"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
              {opt.icon && (
                <span className="text-2xl" aria-hidden="true">{opt.icon}</span>
              )}
              <span className="text-center leading-tight">{opt.label}</span>
            </button>
          )
        })}
      </div>

      {typingDone && (
        <div className="flex items-center justify-between w-full max-w-sm gap-3">
          <span
            className="text-xs text-[var(--muted)] font-['DM_Sans']"
            aria-live="polite"
          >
            {selected.size}
            <span className="mx-0.5 opacity-60">/</span>
            {minSelections} mín
          </span>
          <button
            className={[
              'flex-1 py-2.5 rounded-xl font-bold font-["Syne"] text-sm',
              'transition-all duration-200',
              canConfirm && !confirmed
                ? 'bg-[var(--signal)] text-[var(--navy)] hover:opacity-90'
                : 'bg-white/10 text-[var(--muted)] cursor-not-allowed',
            ].join(' ')}
            onClick={handleConfirm}
            disabled={!canConfirm || confirmed}
            aria-disabled={!canConfirm || confirmed}
          >
            {confirmed ? '✓ Listo' : 'Confirmar →'}
          </button>
        </div>
      )}
    </div>
  )
}

export default MultiSelectQuestion
