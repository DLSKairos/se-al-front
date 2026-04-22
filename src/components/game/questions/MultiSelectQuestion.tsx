/**
 * MultiSelectQuestion — lista vertical de tarjetas full-width con icono, texto y radio/check
 *
 * Props nueva API:
 *   options   Array<{ label: string; value: string; icon?: string }>
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
  typingDone?: boolean
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
  typingDone: propTypingDone,
  onAnswer,
  question,
  onAnswerLegacy,
}: MultiSelectQuestionProps) {
  const [selected,           setSelected]           = useState<Set<string>>(new Set())
  const [confirmed,          setConfirmed]          = useState(false)
  const [internalTypingDone, setInternalTypingDone] = useState(!question)
  const typingDone = (propTypingDone !== undefined && !question) ? propTypingDone : internalTypingDone

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
              onDone={() => setInternalTypingDone(true)}
            />
          </div>
          <div className="w-0 h-0 mx-auto speech-triangle-down" aria-hidden="true" />
        </div>
      )}

      {/* Lista vertical full-width */}
      <div
        className={[
          'flex flex-col gap-3 w-full transition-all duration-300',
          typingDone ? 'opacity-100' : 'opacity-0 pointer-events-none',
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
                'flex items-center gap-4 w-full px-5 py-4 rounded-2xl border-2',
                'text-left transition-all duration-200 active:scale-[0.98]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isSelected
                  ? 'border-[var(--signal)] bg-[rgba(0,212,255,0.08)]'
                  : 'border-white/15 bg-[rgba(255,255,255,0.04)] hover:border-white/30',
              ].join(' ')}
              onClick={() => toggleOption(opt.value)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              aria-label={opt.label}
            >
              {/* Icono / inicial */}
              {opt.icon ? (
                <span className="text-2xl shrink-0" aria-hidden="true">{opt.icon}</span>
              ) : (
                <span
                  className="w-8 h-8 rounded-full bg-white/10 shrink-0 grid place-items-center text-xs font-bold text-[var(--muted)]"
                  aria-hidden="true"
                >
                  {opt.label.charAt(0).toUpperCase()}
                </span>
              )}

              {/* Texto */}
              <span className="flex-1 font-sub font-semibold text-base text-[var(--cream)] leading-tight">
                {opt.label}
              </span>

              {/* Radio / Check */}
              <span
                className={[
                  'shrink-0 w-5 h-5 rounded-full border-2 grid place-items-center transition-colors',
                  isSelected
                    ? 'border-[var(--signal)] bg-[var(--signal)]'
                    : 'border-white/30',
                ].join(' ')}
                aria-hidden="true"
              >
                {isSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Botón comprobar full-width */}
      {typingDone && (
        <button
          className={[
            'w-full py-4 rounded-2xl font-sub font-bold text-base tracking-wide uppercase',
            'transition-all duration-200 active:scale-[0.98]',
            canConfirm && !confirmed
              ? 'bg-[var(--terracotta)] text-[var(--cream)] hover:opacity-90'
              : 'bg-white/10 text-[var(--muted)] cursor-not-allowed',
          ].join(' ')}
          onClick={handleConfirm}
          disabled={!canConfirm || confirmed}
          aria-disabled={!canConfirm || confirmed}
        >
          {confirmed ? '✓ Listo' : 'Comprobar'}
        </button>
      )}
    </div>
  )
}

export default MultiSelectQuestion
