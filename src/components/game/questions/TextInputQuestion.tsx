/**
 * TextInputQuestion — campo de texto grande con botón "Comprobar" full-width
 *
 * Props nueva API:
 *   type       'text' | 'number' | 'date' | 'datetime-local'
 *   required   boolean
 *   placeholder string
 *   typingDone  boolean — controlado por LevelWrapper
 *   onAnswer   (value: string) => void
 *
 * Props legacy QuestionWrapper:
 *   question   object
 *   onAnswer   (questionId, value: string) => void  ← legacy
 */
import { useState, useRef, useEffect } from 'react'
import TypewriterQuestion from './TypewriterQuestion'

interface TextInputQuestionProps {
  /** Modo nuevo API */
  type?: 'text' | 'number' | 'date' | 'datetime-local'
  required?: boolean
  placeholder?: string
  typingDone?: boolean
  onAnswer: (value: string) => void

  /** Modo legacy QuestionWrapper */
  question?: {
    id: string
    question: string
    icon?: string
    type?: string
    placeholder?: string
    min?: number | string
    max?: number | string
  }
  onAnswerLegacy?: (questionId: string, value: string) => void
}

function TextInputQuestion({
  type: propType = 'text',
  required = false,
  placeholder: propPlaceholder,
  typingDone: propTypingDone,
  onAnswer,
  question,
  onAnswerLegacy,
}: TextInputQuestionProps) {
  const [internalTypingDone, setInternalTypingDone] = useState(!question)
  const typingDone = (propTypingDone !== undefined && !question) ? propTypingDone : internalTypingDone
  const [value,     setValue]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typingDone && inputRef.current) {
      inputRef.current.focus()
    }
  }, [typingDone])

  const resolvedType = question
    ? (question.type === 'number' ? 'number' : question.type === 'date' ? 'date' : 'text')
    : propType

  const resolvedPlaceholder = propPlaceholder
    ?? question?.placeholder
    ?? (resolvedType === 'number' ? '0' : resolvedType === 'date' ? 'YYYY-MM-DD' : '')

  const handleSubmit = () => {
    if (submitted) return
    if (required && !value.trim()) return
    setSubmitted(true)

    if (question) {
      onAnswerLegacy?.(question.id, value)
    } else {
      onAnswer(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const canSubmit = !required || !!value.trim()

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

      <div
        className={[
          'flex flex-col gap-3 w-full transition-all duration-300',
          typingDone ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          className={[
            'w-full px-5 py-4 rounded-2xl border-2 font-dm text-base',
            'bg-[rgba(255,255,255,0.05)] text-[var(--cream)]',
            'placeholder:text-[rgba(250,244,232,0.3)] outline-none',
            'transition-colors',
            submitted
              ? 'border-white/10 opacity-60'
              : 'border-white/15 focus:border-[var(--signal)] focus:bg-[rgba(0,212,255,0.04)]',
          ].join(' ')}
          type={resolvedType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          min={question?.min}
          max={question?.max}
          disabled={submitted}
          aria-label={question?.question ?? 'Respuesta'}
          required={required}
        />

        <button
          className={[
            'w-full py-4 rounded-2xl font-sub font-bold text-base tracking-wide uppercase',
            'transition-all duration-200 active:scale-[0.98]',
            submitted
              ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30'
              : !canSubmit
              ? 'bg-white/10 text-[var(--muted)] cursor-not-allowed'
              : 'bg-[var(--terracotta)] text-[var(--cream)] hover:opacity-90',
          ].join(' ')}
          onClick={handleSubmit}
          disabled={submitted}
          aria-label="Confirmar respuesta"
        >
          {submitted ? '✓ Guardado' : 'Comprobar'}
        </button>
      </div>
    </div>
  )
}

export default TextInputQuestion
