/**
 * TextInputQuestion — pregunta con campo de texto libre, número o fecha
 *
 * Props nueva API:
 *   type       'text' | 'number' | 'date' | 'datetime-local'
 *   required   boolean
 *   placeholder string
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
  onAnswer,
  question,
  onAnswerLegacy,
}: TextInputQuestionProps) {
  const [typingDone, setTypingDone] = useState(!question)
  const [value,      setValue]      = useState('')
  const [submitted,  setSubmitted]  = useState(false)
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
          'flex gap-2 w-full max-w-sm transition-all duration-300',
          typingDone ? 'opacity-100 game-bounce-in' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          className={[
            'flex-1 px-4 py-3 rounded-xl border font-["DM_Sans"] text-sm',
            'bg-[var(--navy-light)] text-[var(--off-white)]',
            'placeholder:text-[var(--muted)] outline-none',
            'transition-colors',
            submitted
              ? 'border-white/10 opacity-60'
              : 'border-white/20 focus:border-[var(--signal)]',
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
            'w-12 h-12 rounded-xl font-bold text-lg transition-all duration-200',
            submitted
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-[var(--signal)] text-[var(--navy)] hover:opacity-90 active:scale-95',
          ].join(' ')}
          onClick={handleSubmit}
          disabled={submitted}
          aria-label="Confirmar"
        >
          {submitted ? '✓' : '→'}
        </button>
      </div>
    </div>
  )
}

export default TextInputQuestion
